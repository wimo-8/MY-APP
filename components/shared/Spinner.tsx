
import React from 'react';

interface SpinnerProps {
    small?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ small = false }) => {
    const sizeClasses = small ? 'h-6 w-6' : 'h-12 w-12';
    const borderClasses = small ? 'border-2' : 'border-4';
    return (
        <div className={`
            ${sizeClasses}
            ${borderClasses}
            rounded-full
            border-t-sky-400
            border-r-sky-400
            border-b-slate-600
            border-l-slate-600
            animate-spin
            inline-block
        `}></div>
    );
};

export default Spinner;
