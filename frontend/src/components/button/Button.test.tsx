/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
    describe('variant', () => {
        it('should apply cohe-btn-primary for primary variant', () => {
            const { container } = render(<Button variant="primary">Primary</Button>);
            const button = container.querySelector('button');
            expect(button?.className).toContain('cohe-btn-primary');
        });

        it('should apply cohe-btn-secondary for secondary variant', () => {
            const { container } = render(<Button variant="secondary">Secondary</Button>);
            const button = container.querySelector('button');
            expect(button?.className).toContain('cohe-btn-secondary');
        });

        it('should apply cohe-btn-outline for outline variant', () => {
            const { container } = render(<Button variant="outline">Outline</Button>);
            const button = container.querySelector('button');
            expect(button?.className).toContain('cohe-btn-outline');
        });
    });

    describe('size', () => {
        it('should apply md size classes by default', () => {
            const { container } = render(<Button variant="primary">Default</Button>);
            const button = container.querySelector('button');
            expect(button?.className).toContain('text-base');
            expect(button?.className).toContain('px-4');
            expect(button?.className).toContain('py-2');
        });

        it('should apply lg size classes', () => {
            const { container } = render(<Button variant="primary" size="lg">Large</Button>);
            const button = container.querySelector('button');
            expect(button?.className).toContain('text-lg');
            expect(button?.className).toContain('font-semibold');
            expect(button?.className).toContain('px-6');
            expect(button?.className).toContain('py-3');
        });
    });

    it('should apply rounded-md base class', () => {
        const { container } = render(<Button variant="primary">Test</Button>);
        const button = container.querySelector('button');
        expect(button?.className).toContain('rounded-md');
    });
});
