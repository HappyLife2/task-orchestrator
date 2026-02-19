'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

interface PortalMenuProps {
    triggerRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    children: React.ReactNode;
    width?: number | string;
    height?: number | string;
}

export function PortalMenu({ triggerRef, onClose, children, width, height }: PortalMenuProps) {
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', top: -9999, left: -9999, zIndex: 9999 });
    const menuRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useLayoutEffect(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = (typeof height === 'number' ? height : 350); // Default guess

        const computedStyle: React.CSSProperties = {
            position: 'fixed',
            left: rect.left,
            zIndex: 9999,
            minWidth: width ?? rect.width,
        };

        if (spaceBelow >= menuHeight || spaceBelow > rect.top) {
            computedStyle.top = rect.bottom + 4;
        } else {
            computedStyle.bottom = window.innerHeight - rect.top + 4;
        }

        setStyle(computedStyle);
    }, [triggerRef, width, height]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                onCloseRef.current();
            }
        };
        const id = setTimeout(() => document.addEventListener('click', handler, { capture: false }), 0);
        return () => {
            clearTimeout(id);
            document.removeEventListener('click', handler, { capture: false });
        };
    }, [triggerRef]);

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div ref={menuRef} style={style}>
            {children}
        </div>,
        document.body
    );
}
