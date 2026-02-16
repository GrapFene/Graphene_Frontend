import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

/**
 * Loading Spinner Component
 * 
 * Functionality: Displays a rotating spinner icon for loading states.
 * Input: size (number, optional) - The size of the spinner in pixels (default: 24).
 *        className (string, optional) - Additional CSS classes.
 * Response: JSX.Element - The rendered loading spinner.
 */
export default function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
    return (
        <Loader2
            className={`animate-spin ${className}`}
            size={size}
        />
    );
}
