import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type ShapeType = 'cross' | 'triangle' | 'circle' | 'sun' | 'airplane' | 'dots' | 'pencil' | 'book' | 'rocket';

@Component({
  selector: 'app-floating-shape',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-shape.html',
  styleUrl: './floating-shape.scss',
})
export class FloatingShape {
  @Input() shape: ShapeType = 'cross';
  @Input() color = 'text-blue-400';
  @Input() size = 'w-8 h-8';
  @Input() customClass = 'top-0 left-0';
  @Input() animation = '';

  get motionClass(): string {
    switch (this.animation) {
      case 'animate-float-slow':
        return 'shape-motion--float-slow';
      case 'animate-float-fast':
        return 'shape-motion--float-fast';
      case 'animate-float-diagonal':
        return 'shape-motion--float-diagonal';
      case 'animate-spin-slow':
        return 'shape-motion--spin-slow';
      case 'animate-pulse':
        return 'shape-motion--pulse';
      default:
        return '';
    }
  }
}
