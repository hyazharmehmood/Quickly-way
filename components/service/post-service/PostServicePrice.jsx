import React, { useState, useEffect } from 'react';
import { CURRENCIES } from '@/utils/constants';
import { Loader2 } from 'lucide-react';

const PostServicePrice = (props) => {
    const {
        priceStr, setPriceStr,
        selectedCurrency, setSelectedCurrency,
        priceBreakdowns, setPriceBreakdowns,
        paymentMethods, setPaymentMethods,
        availableForJob, setAvailableForJob,
        onBack, onSave, onCancel,
        defaultPaymentMethods, defaultPriceBreakdowns,
        isLoading
    } = props;

    const [expandedBreakdowns, setExpandedBreakdowns] = useState({});
    const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);

    // Auto-calculate total price from breakdowns
    useEffect(() => {
        // Only auto-update if user hasn't manually edited the price
        if (!isManualPriceEdit) {
            const total = priceBreakdowns.reduce((sum, breakdown) => {
                const price = breakdown.price ? parseFloat(breakdown.price) : 0;
                return sum + (isNaN(price) ? 0 : price);
            }, 0);
            
            // Update priceStr with the calculated total (as integer string)
            if (total > 0) {
                const newPriceStr = Math.round(total).toString();
                if (newPriceStr !== priceStr) {
                    setPriceStr(newPriceStr);
                }
            } else if (priceBreakdowns.every(b => !b.price || b.price === '')) {
                // If all breakdowns are empty, clear the price
                if (priceStr !== '') {
                    setPriceStr('');
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceBreakdowns]);

    const toggleExpand = (index) => {
        setExpandedBreakdowns(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handlePriceChange = (e) => {
        let numericValue = e.target.value.replace(/[^0-9]/g, '');
        if (numericValue.length > 10) numericValue = numericValue.slice(0, 10);
        setPriceStr(numericValue);
        setIsManualPriceEdit(true); // Mark as manually edited
    };

    const handlePriceBreakdownChange = (index, field, value) => {
        setPriceBreakdowns(prev => {
            const newItems = [...prev];
            // Ensure object exists if we are dynamically adding but here we initialized it
            if (!newItems[index]) newItems[index] = { id: `pb-${index}`, text: "", price: "", included: "" };

            newItems[index] = { ...newItems[index], [field]: value };
            
            // If price field changed, reset manual edit flag to allow auto-calculation
            if (field === 'price') {
                setIsManualPriceEdit(false);
            }
            
            return newItems;
        });
    };





    const handlePaymentMethodsFocus = () => {
        if (!paymentMethods) {
            setPaymentMethods("I accept payments via Cash");
        }
    };

    const handlePaymentMethodsBlur = () => {
        if (paymentMethods === "I accept payments via Cash") {
            setPaymentMethods("");
        }
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Price Section */}
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-base font-medium text-gray-900">Price <span className="text-red-500">*</span></label>
                        <div className="flex">
                            <div className="relative">
                                <select
                                    value={selectedCurrency}
                                    onChange={(e) => setSelectedCurrency(e.target.value)}
                                    className="appearance-none bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg py-3 pl-4 pr-8 text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:border-green-500 h-full"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={priceStr}
                                onChange={handlePriceChange}
                                placeholder="0.00"
                                className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-4">
                        <label className="block text-base font-medium text-gray-900">Price breakdown</label>

                        <div className="space-y-2">
                            {priceBreakdowns.map((breakdown, index) => {
                                const isExpanded = expandedBreakdowns[index];
                                return (
                                    <div key={breakdown.id || index} className="border border-gray-200 rounded-lg p-2 bg-gray-50/50 space-y-3 relative group">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={breakdown.text || ""}
                                                onChange={(e) => handlePriceBreakdownChange(index, 'text', e.target.value)}
                                                placeholder="Package Name (e.g., Basic Logo Design)"
                                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700 bg-white"
                                            />
                                            <div className="w-32 flex">
                                                <div className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg px-3 flex items-center text-sm text-gray-600 font-medium">
                                                    {selectedCurrency}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={breakdown.price || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        handlePriceBreakdownChange(index, 'price', val);
                                                    }}
                                                    placeholder="0"
                                                    className="w-full px-3 py-3 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700 text-center"
                                                />
                                            </div>
                                        </div>

                                        {/* Toggle View Details */}
                                        <div >
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(index)}
                                                className="flex items-center justify-between w-full gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                View details
                                                <svg
                                                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="relative animate-in slide-in-from-top-2 duration-200">
                                                <label className="absolute -top-2.5 left-3 bg-[#FAFAFA] px-1 text-xs font-medium text-gray-500">
                                                    Included
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={breakdown.included || ""}
                                                    onChange={(e) => handlePriceBreakdownChange(index, 'included', e.target.value)}
                                                    placeholder="List what's included (e.g., 2 Revisions, Source File)..."
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm text-gray-700 bg-white resize-none"
                                                />
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        {priceBreakdowns.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newItems = priceBreakdowns.filter((_, i) => i !== index);
                                                    setPriceBreakdowns(newItems);
                                                    setIsManualPriceEdit(false); // Allow auto-calculation after deletion
                                                }}
                                                className="absolute -top-3 -right-3 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-1.5 shadow-sm hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove package"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add New Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setPriceBreakdowns([
                                    ...priceBreakdowns,
                                    { id: `pb-${Date.now()}`, text: "", price: "", included: "" }
                                ]);
                                setIsManualPriceEdit(false); // Allow auto-calculation after adding new breakdown
                            }}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Add another price option
                        </button>
                    </div>
                </div>


            </div>

            {/* Row 5: Payment Methods */}
            <div className="mb-6 space-y-1.5">
                <label className="block text-base font-medium text-gray-900">Payment methods</label>
                <textarea
                    rows={3}
                    value={paymentMethods}
                    onFocus={handlePaymentMethodsFocus}
                    onBlur={handlePaymentMethodsBlur}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    placeholder={defaultPaymentMethods}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700 leading-relaxed resize-none"
                />
                <div className="text-right text-xs text-gray-500">
                    {paymentMethods.length}/150
                </div>
            </div>

            {/* Row 6: Employment Status */}
            <div className="mb-10">
                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={availableForJob}
                        onChange={(e) => setAvailableForJob(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-[#10b981]"
                    />
                    <span className="text-base text-gray-700 font-medium">I am ready for full-time employment</span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3.5 border border-gray-300 rounded-full text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    onClick={onSave}
                    disabled={isLoading}
                    className="flex-1 py-3.5 bg-[#10b981] text-white rounded-full font-bold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Service"
                    )}
                </button>
            </div>
        </div>
    );
};

export default PostServicePrice;
