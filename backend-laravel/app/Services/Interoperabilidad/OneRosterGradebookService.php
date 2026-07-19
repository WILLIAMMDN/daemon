<?php

namespace App\Services\Interoperabilidad;

use App\Models\CategoriaCalificacion;
use App\Models\ClienteOneRoster;
use App\Models\ItemCalificacion;
use App\Models\ResultadoCalificacion;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OneRosterGradebookService
{
    public function categories(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        $query = $this->categoriesInstitucion($cliente);

        return $this->coleccion(
            $request,
            $query,
            'categories',
            fn (CategoriaCalificacion $categoria) => $this->category($categoria),
            ['sourcedId' => 'sourced_id', 'status' => 'estado', 'title' => 'titulo'],
        );
    }

    public function lineItems(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        $query = $this->lineItemsInstitucion($cliente);

        return $this->coleccion(
            $request,
            $query,
            'lineItems',
            fn (ItemCalificacion $item) => $this->lineItem($item),
            [
                'sourcedId' => 'sourced_id', 'status' => 'estado', 'title' => 'titulo',
                'assignDate' => 'fecha_asignacion', 'dueDate' => 'fecha_vencimiento',
            ],
        );
    }

    public function results(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        $query = $this->resultsInstitucion($cliente);

        return $this->coleccion(
            $request,
            $query,
            'results',
            fn (ResultadoCalificacion $resultado) => $this->result($resultado),
            ['sourcedId' => 'sourced_id', 'status' => 'estado', 'score' => 'puntaje', 'scoreDate' => 'calificado_at'],
        );
    }

    public function item(string $tipo, string $sourcedId, ClienteOneRoster $cliente): JsonResponse
    {
        [$clave, $item, $mapper] = match ($tipo) {
            'categories' => [
                'category',
                $this->categoriesInstitucion($cliente)->where('sourced_id', $sourcedId)->firstOrFail(),
                fn (CategoriaCalificacion $categoria) => $this->category($categoria),
            ],
            'lineItems' => [
                'lineItem',
                $this->lineItemsInstitucion($cliente)->where('items_calificacion.sourced_id', $sourcedId)->firstOrFail(),
                fn (ItemCalificacion $lineItem) => $this->lineItem($lineItem),
            ],
            'results' => [
                'result',
                $this->resultsInstitucion($cliente)->where('resultados_calificacion.sourced_id', $sourcedId)->firstOrFail(),
                fn (ResultadoCalificacion $result) => $this->result($result),
            ],
            default => abort(404),
        };

        return response()->json([$clave => $mapper($item)]);
    }

    private function lineItemsInstitucion(ClienteOneRoster $cliente): Builder
    {
        return ItemCalificacion::query()
            ->with(['institucion', 'aula', 'categoria', 'objetivos'])
            ->where('id_institucion', $cliente->id_institucion)
            ->whereNotNull('id_aula')
            ->whereHas('institucion', fn (Builder $query) => $query->whereNotNull('sourced_id'))
            ->whereHas('aula', fn (Builder $query) => $query->whereNotNull('sourced_id'))
            ->whereHas('categoria');
    }

    private function categoriesInstitucion(ClienteOneRoster $cliente): Builder
    {
        return CategoriaCalificacion::query()
            ->where('id_institucion', $cliente->id_institucion)
            ->whereHas('items', fn (Builder $items) => $items
                ->whereNotNull('id_aula')
                ->whereHas('aula', fn (Builder $aula) => $aula->whereNotNull('sourced_id')));
    }

    private function resultsInstitucion(ClienteOneRoster $cliente): Builder
    {
        return ResultadoCalificacion::query()
            ->with(['alumno', 'item.institucion', 'item.aula', 'item.categoria', 'item.objetivos'])
            ->whereHas('item', fn (Builder $query) => $query
                ->where('id_institucion', $cliente->id_institucion)
                ->whereNotNull('id_aula')
                ->whereHas('aula', fn (Builder $aula) => $aula->whereNotNull('sourced_id')))
            ->whereHas('alumno', fn (Builder $query) => $query->whereNotNull('sourced_id'));
    }

    private function category(CategoriaCalificacion $categoria): array
    {
        return [
            ...$this->base($categoria->sourced_id, $categoria->estado, $categoria->updated_at),
            'title' => $categoria->titulo,
        ];
    }

    private function lineItem(ItemCalificacion $item): array
    {
        $asignacion = $item->fecha_asignacion ?? $item->created_at;
        $vencimiento = $item->fecha_vencimiento ?? $asignacion;
        $objetivos = $item->objetivos->pluck('uuid')->filter()->values()->all();

        return array_filter([
            ...$this->base($item->sourced_id, $item->estado, $item->updated_at),
            'title' => $item->titulo,
            'description' => $item->descripcion,
            'assignDate' => $asignacion?->utc()->toIso8601ZuluString(),
            'dueDate' => $vencimiento?->utc()->toIso8601ZuluString(),
            'class' => $this->referencia('class', 'rostering/v1p2/classes', $item->aula?->sourced_id),
            'school' => $this->referencia('org', 'rostering/v1p2/orgs', $item->institucion?->sourced_id),
            'category' => $this->referencia('category', 'gradebook/v1p2/categories', $item->categoria?->sourced_id),
            'resultValueMin' => 0,
            'resultValueMax' => (float) $item->puntaje_maximo,
            'learningObjectiveSet' => $objetivos ? [[
                'source' => 'unknown',
                'learningObjectiveIds' => $objetivos,
            ]] : null,
        ], fn ($value) => $value !== null);
    }

    private function result(ResultadoCalificacion $resultado): array
    {
        return array_filter([
            ...$this->base($resultado->sourced_id, 'active', $resultado->updated_at),
            'lineItem' => $this->referencia('lineItem', 'gradebook/v1p2/lineItems', $resultado->item?->sourced_id),
            'student' => $this->referencia('user', 'rostering/v1p2/users', $resultado->alumno?->sourced_id),
            'class' => $this->referencia('class', 'rostering/v1p2/classes', $resultado->item?->aula?->sourced_id),
            'scoreStatus' => $resultado->estado,
            'score' => (float) $resultado->puntaje,
            'scoreDate' => $resultado->calificado_at?->format('Y-m-d'),
            'comment' => $resultado->retroalimentacion,
        ], fn ($value) => $value !== null);
    }

    private function referencia(string $tipo, string $recurso, ?string $sourcedId): ?array
    {
        if (! $sourcedId) {
            return null;
        }

        return [
            'type' => $tipo,
            'href' => url("/ims/oneroster/{$recurso}/{$sourcedId}"),
            'sourcedId' => $sourcedId,
        ];
    }

    private function base(?string $sourcedId, string $estado, CarbonInterface|string|null $fecha): array
    {
        return [
            'sourcedId' => $sourcedId,
            'status' => in_array($estado, ['active', 'fully graded'], true) ? 'active' : 'tobedeleted',
            'dateLastModified' => $fecha instanceof CarbonInterface
                ? $fecha->utc()->toIso8601ZuluString()
                : now()->utc()->toIso8601ZuluString(),
        ];
    }

    private function coleccion(Request $request, Builder $query, string $clave, callable $mapper, array $campos): JsonResponse
    {
        $this->aplicarFiltro($request, $query, $campos);
        $total = (clone $query)->count();
        $limite = min(1000, max(1, $request->integer('limit', 100)));
        $offset = max(0, $request->integer('offset', 0));
        $orden = strtolower((string) $request->query('orderBy')) === 'desc' ? 'desc' : 'asc';
        $campoOrden = $campos[$request->query('sort')] ?? $query->getModel()->qualifyColumn('id');
        $items = $query->orderBy($campoOrden, $orden)->offset($offset)->limit($limite)->get()->map($mapper);
        $fields = array_values(array_filter(explode(',', (string) $request->query('fields'))));
        if ($fields) {
            $items = $items->map(fn (array $item) => array_intersect_key($item, array_flip($fields)));
        }

        return response()->json([$clave => $items->values()])
            ->header('X-Total-Count', (string) $total)
            ->header('X-Offset', (string) $offset)
            ->header('X-Limit', (string) $limite);
    }

    private function aplicarFiltro(Request $request, Builder $query, array $campos): void
    {
        $filtro = trim((string) $request->query('filter'));
        if ($filtro === '') {
            return;
        }

        abort_unless(preg_match("/^([A-Za-z][A-Za-z0-9]*)\\s*(=|!=|>=|<=|>|<|~)\\s*'([^']*)'$/", $filtro, $coincidencia) === 1, 400, 'Filtro OneRoster inválido.');
        [, $campo, $operador, $valor] = $coincidencia;
        abort_unless(isset($campos[$campo]), 400, 'Campo de filtro no permitido.');
        $query->where($campos[$campo], $operador === '~' ? 'like' : ($operador === '=' ? '=' : $operador), $operador === '~' ? "%{$valor}%" : $valor);
    }
}
