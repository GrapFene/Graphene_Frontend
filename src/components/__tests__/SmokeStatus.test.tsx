import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';


// A simple component to test
const Status = () => <div>System Operational</div>;

describe('Smoke Status Component', () => {
    it('renders the status message', () => {
        render(<Status />);
        expect(screen.getByText('System Operational')).toBeInTheDocument();
    });
});
