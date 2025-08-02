import React, { useEffect } from "react";
import { X } from "lucide-react";

interface RowDetailModalProps {
    open: boolean;
    onClose: () => void;
    item: any;
    rowIndex: number;
    onUpdate: (field: string, value: any) => void;
    images: string[];
}

const RowDetailModal: React.FC<RowDetailModalProps> = ({
    open,
    onClose,
    item,
    rowIndex,
    onUpdate,
    images,
}) => {
    useEffect(() => {
        if (!open) return;
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-5xl mx-4 rounded-2xl bg-white shadow-xl p-8" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-lg font-semibold mb-6">Row&nbsp;{rowIndex + 1} — detailed view</h3>

                <div className="grid lg:grid-cols-8 sm:grid-cols-2 gap-4 mb-8">
                    {(
                        [
                            ["Product", "Product"],
                            ["QTY", "QTY"],
                            ["HSN", "HSN"],
                            ["MRP", "MRP"],
                            ["RATE", "RATE"],
                            ["DIS", "DIS"],
                            ["SGST", "SGST"],
                            ["CGST", "CGST"],
                        ] as const
                    ).map(([label, key]) => (
                        <label key={key} className="text-sm font-medium text-gray-600">
                            {label}
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2"
                                type={key === "Product" ? "text" : "number"}
                                value={item[key] ?? ""}
                                onChange={(e) => onUpdate(key, e.target.value)}
                            />
                        </label>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                    {images.length === 0 && (
                        <p className="text-gray-500 text-sm">No images for this row</p>
                    )}
                    {images.map((src, i) => (
                        <img
                            key={i}
                            src={src}
                            alt={`cell ${rowIndex}-${i}`}
                            className="border rounded-lg object-contain w-[100px] h-[120px]"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RowDetailModal;