'use client'
import { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle, Info, AlertTriangle, XCircle, X, Zap, Ban } from "lucide-react"
import './Toast.css'

const ToastContext = createContext(undefined)

export function ToastProvider({
    children,
    defaultDuration = 3000,
    defaultTheme = "light",
    defaultPosition = "top-right"
}) {
    const [toasts, setToasts] = useState([])
    const [theme, setTheme] = useState(defaultTheme)

    const addToast = useCallback((toast) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast = {
            ...toast,
            id,
            isExiting: false,
            duration: toast.duration ?? defaultDuration,
            position: toast.position ?? defaultPosition
        }

        setToasts(prev => [...prev, newToast])

        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, newToast.duration)
        }
    }, [defaultDuration, defaultPosition])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(toast => toast.id === id ? { ...toast, isExiting: true } : toast))
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id))
        }, 300)
    }, [])

    const clearToasts = useCallback(() => {
        setToasts(prev => prev.map(toast => ({ ...toast, isExiting: true })))
        setTimeout(() => {
            setToasts([])
        }, 300)
    }, [])

    const showToast = (variant, message, options = {}) => {
        addToast({
            message,
            variant,
            duration: options.duration,
            position: options.position || defaultPosition,
            action: options.action
        })
    }

    return (
        <ToastContext.Provider value={{
            toasts,
            addToast,
            removeToast,
            clearToasts,
            theme,
            setTheme,
            success: (msg, opts) => showToast("success", msg, opts),
            error: (msg, opts) => showToast("error", msg, opts),
            info: (msg, opts) => showToast("info", msg, opts),
            warning: (msg, opts) => showToast("warning", msg, opts),
        }}>
            <div>
                {children}
                <ToastContainer toasts={toasts} onRemove={removeToast} theme={theme} />
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}

function ToastContainer({ toasts, onRemove, theme }) {
    const grouped = toasts.reduce((acc, toast) => {
        if (!acc[toast.position]) acc[toast.position] = []
        acc[toast.position].push(toast)
        return acc
    }, {})

    const getPositionClasses = (position) => {
        const base = "fixed z-50 flex flex-col gap-3 p-4 pointer-events-none"
        switch (position) {
            case "top-left": return `${base} top-0 left-0`
            case "top-center": return `${base} top-0 left-1/2 transform -translate-x-1/2`
            case "top-right": return `${base} top-0 right-0`
            case "bottom-left": return `${base} bottom-0 left-0`
            case "bottom-center": return `${base} bottom-0 left-1/2 transform -translate-x-1/2`
            case "bottom-right": return `${base} bottom-0 right-0`
            default: return `${base} top-0 right-0`
        }
    }

    return (
        <>
            {Object.entries(grouped).map(([position, positionToasts]) => (
                <div key={position} className={getPositionClasses(position)}>
                    {positionToasts.map((toast) => (
                        <ToastComponent key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} theme={theme} />
                    ))}
                </div>
            ))}
        </>
    )
}

function ToastComponent({ toast, onRemove, theme }) {
    const getAccentColor = (variant) => {
        const colors = {
            success: theme === "dark" ? "rgba(74,222,128,0.8)" : "rgba(34,197,94,1)",
            info: theme === "dark" ? "rgba(96,165,250,0.8)" : "rgba(59,130,246,1)",
            warning: theme === "dark" ? "rgba(250,204,21,0.8)" : "rgba(202,138,4,1)",
            error: theme === "dark" ? "rgba(248,113,113,0.8)" : "rgba(220,38,38,1)",
            default: theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(100,116,139,0.6)",
        }
        return colors[toast.variant] || colors.default
    }

    const getVariantStyles = (variant) => {
        const baseDark = "bg-[#060606] text-white"
        const baseLight = "bg-white"

        const variants = {
            success: {
                dark: `${baseDark} border-green-400 shadow-[0_8px_30px_-4px_rgba(74,222,128,0.5)]`,
                light: `${baseLight} text-green-900 border-green-400 shadow-[0_8px_30px_-4px_rgba(74,222,128,0.5)]`
            },
            info: {
                dark: `${baseDark} border-blue-400 shadow-[0_8px_30px_-4px_rgba(96,165,250,0.5)]`,
                light: `${baseLight} text-blue-900 border-blue-400 shadow-[0_8px_30px_-4px_rgba(96,165,250,0.5)]`
            },
            warning: {
                dark: `${baseDark} border-yellow-400 shadow-[0_8px_30px_-4px_rgba(250,204,21,0.5)]`,
                light: `${baseLight} text-yellow-900 border-yellow-400 shadow-[0_8px_30px_-4px_rgba(250,204,21,0.5)]`
            },
            error: {
                dark: `${baseDark} border-red-400 shadow-[0_8px_30px_-4px_rgba(248,50,50,0.5)]`,
                light: `${baseLight} text-red-900 border-red-400 shadow-[0_8px_30px_-4px_rgba(248,113,113,0.5)]`
            },
            default: {
                dark: `${baseDark} border-gray-400 shadow-[0_8px_30px_-4px_rgba(100,116,139,0.2)]`,
                light: `${baseLight} text-gray-900 border-gray-400 shadow-[0_8px_30px_-4px_rgba(100,116,139,0.2)]`
            }
        }

        return variants[variant]?.[theme] || variants.default[theme]
    }

    const getIcon = (variant) => {
        const iconClass = "w-5 h-5 flex-shrink-0"
        switch (variant) {
            case "success": return <CheckCircle className={`text-green-400 ${iconClass}`} />
            case "info": return <Info className={`text-blue-400 ${iconClass}`} />
            case "warning": return <AlertTriangle className={`text-yellow-400 ${iconClass}`} />
            case "error": return <Ban className={`text-red-400 ${iconClass}`} />
            default: return <Info className={`text-blue-400 ${iconClass}`} />
        }
    }

    return (
        <div
            className={`
                ${getVariantStyles(toast.variant)}
                ${toast.isExiting ? "toast-exit" : "toast-enter"}
                pointer-events-auto
                min-w-80 max-w-md w-full sm:w-auto
                p-4 rounded-xl border-2
                backdrop-blur-sm
                shadow-2xl
                transform transition-all duration-300 ease-out
                hover:scale-105
                relative overflow-hidden
            `}
        >
            <div className="flex items-center gap-3">
                <div className="mt-0.5">{getIcon(toast.variant)}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-relaxed break-words">{toast.message}</p>
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-3 cursor-pointer px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5"
                            style={{
                                color: theme === "dark" ? "#fff" : "#000",
                                backgroundColor: theme === "dark"
                                    ? "rgba(99, 102, 241, 0.15)"
                                    : "rgba(99, 102, 241, 0.1)",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                            }}
                        >
                            <Zap className="w-3 h-3" />
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                        theme === 'dark'
                            ? 'text-white/70 hover:text-white hover:bg-white/20'
                            : 'text-zinc-700 hover:text-black hover:bg-black/10'
                    }`}
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-1 overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-zinc-300/50'}`}>
                <div
                    className="h-full animate-progress"
                    style={{
                        backgroundColor: getAccentColor(toast.variant),
                        animationDuration: `${toast.duration || 5000}ms`,
                        animationTimingFunction: 'linear',
                    }}
                ></div>
            </div>
        </div>
    )
}
