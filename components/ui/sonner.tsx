import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '../ThemeProvider';

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <Sonner
      theme={actualTheme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      expand
      richColors
      closeButton
      visibleToasts={4}
      gap={12}
      offset={{ bottom: 24, right: 24, top: 24, left: 24 }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          title: 'group-[.toast]:text-sm group-[.toast]:font-medium',
          description: 'group-[.toast]:text-sm group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border',
        },
      }}
      style={
        {
          zIndex: 99999,
          position: 'fixed',
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />,
    document.body
  );
};

export { Toaster };
