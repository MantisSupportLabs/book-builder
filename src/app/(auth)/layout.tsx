export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Corner brackets */}
            <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-primary opacity-50" />
            <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-primary opacity-50" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-primary opacity-50" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-primary opacity-50" />

            {/* Scan line effect */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--foreground) 2px, var(--foreground) 4px)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {children}
            </div>

            {/* Brand watermark */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground/30 tracking-widest uppercase">
                Book Builder // v1.0
            </div>
        </div>
    );
}
