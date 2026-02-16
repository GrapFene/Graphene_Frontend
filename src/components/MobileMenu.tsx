import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
}

/**
 * Mobile Menu Component
 * 
 * Functionality: Displays a slide-out menu for mobile devices, containing sidebar content.
 * Input: isOpen (boolean) - Whether the menu is visible.
 *        onClose (function) - Handler to close the menu.
 *        onLogout (function) - Handler for user logout.
 *        onProfileClick (function) - Handler for navigating to profile.
 * Response: JSX.Element | null - The rendered mobile menu or null if not open.
 */
export default function MobileMenu({ isOpen, onClose, onLogout, onProfileClick }: MobileMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Prevent scrolling when menu is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm transition-all duration-300">
            <div
                ref={menuRef}
                className="w-[85%] max-w-sm h-full bg-white dark:bg-gray-900 border-l-4 border-black dark:border-gray-700 shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-8px_0px_0px_0px_rgba(255,255,255,0.2)] overflow-y-auto"
            >
                <div className="p-4 flex justify-between items-center border-b-4 border-black dark:border-gray-700 bg-yellow-300 dark:bg-yellow-600 sticky top-0 z-10 text-black dark:text-white">
                    <h2 className="font-black text-xl uppercase">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-red-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6 text-black dark:text-white" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Reuse Sidebar content */}
                    <Sidebar onLogout={() => {
                        onLogout();
                        onClose();
                    }} onProfileClick={() => {
                        onProfileClick();
                        onClose();
                    }} />
                </div>
            </div>
        </div>
    );
}
