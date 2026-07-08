import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-grafico-rendimiento',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './grafico-rendimiento.html',
})
export class GraficoRendimiento implements OnChanges {
  @Input() titulo: string = 'Rendimiento general';
  @Input() etiquetas: string[] = [];
  @Input() datos: number[] = [];
  @Input() tipo: ChartType = 'bar';

  public chartData: ChartData<'bar' | 'line'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Tokens generados',
        backgroundColor: '#2563eb', // blue-600
        hoverBackgroundColor: '#1d4ed8', // blue-700
        borderColor: '#2563eb',
        borderWidth: 0,
        borderRadius: 4,
        barPercentage: 0.6,
        tension: 0.4, // Suavizado para line
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a', // slate-900
        titleFont: { family: 'Inter, sans-serif', size: 14, weight: 'bold' as const },
        bodyFont: { family: 'Inter, sans-serif', size: 13 },
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#64748b' } // slate-500
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' }, // slate-100
        border: { display: false, dash: [4, 4] },
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#94a3b8', stepSize: 10 } // slate-400
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['etiquetas'] || changes['datos']) {
      this.chartData = {
        labels: this.etiquetas,
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: this.datos
          }
        ]
      };
    }
  }
}
