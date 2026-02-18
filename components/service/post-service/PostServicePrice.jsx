import React, { useState, useEffect } from 'react';
import { CURRENCIES, getPaymentMethodsByRegion } from '@/utils/constants';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const PostServicePrice = (props) => {
    const {
        priceStr, setPriceStr,
        selectedCurrency, setSelectedCurrency,
        priceBreakdowns, setPriceBreakdowns,
        paymentRegion,
        paymentMethods, setPaymentMethods,
        paymentMethodsText, setPaymentMethodsText,
        availableForJob, setAvailableForJob,
        onBack, onSave, onCancel,
        defaultPriceBreakdowns,
        isLoading
    } = props;

    // Region fixed to Saudi Arabia (no dropdown); show only Saudi payment methods
    const regionMethods = getPaymentMethodsByRegion(paymentRegion || 'SAUDI_ARABIA');
    const selectedSet = new Set(paymentMethods || []);

    // Build payment description from base text + selected methods
    const buildPaymentDescription = (selected) => {
        const base = 'I accept payments via quicklyway';
        if (!selected?.length) return base;
        return `${base}, ${selected.join(', ')}`;
    };

    const togglePaymentMethod = (label) => {
        setPaymentMethods(prev => {
            const next = new Set(prev || []);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            const newList = Array.from(next);
            setPaymentMethodsText(buildPaymentDescription(newList));
            return newList;
        });
    };

    const selectAllPaymentMethods = () => {
        const allLabels = regionMethods.map(m => m.label);
        setPaymentMethods(allLabels);
        setPaymentMethodsText(buildPaymentDescription(allLabels));
    };

    const [expandedBreakdowns, setExpandedBreakdowns] = useState({});
    const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);
    const [isPriceGroupFocused, setIsPriceGroupFocused] = useState(false);

    // When payment methods are selected and description is empty, set description from selection
    useEffect(() => {
        const selected = paymentMethods || [];
        const currentText = (paymentMethodsText || '').trim();
        const built = buildPaymentDescription(selected);
        if (selected.length > 0 && (currentText === '' || currentText === 'I accept payments via quicklyway')) {
            setPaymentMethodsText(built);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-calculate total price from breakdowns (deferred to avoid setState-during-render)
    useEffect(() => {
        if (isManualPriceEdit) return;
        const total = priceBreakdowns.reduce((sum, breakdown) => {
            const price = breakdown.price ? parseFloat(breakdown.price) : 0;
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
        const newPriceStr = total > 0 ? Math.round(total).toString() : '';
        const shouldUpdate =
            (total > 0 && newPriceStr !== priceStr) ||
            (total === 0 && priceBreakdowns.every(b => !b.price || b.price === '') && priceStr !== '');
        if (shouldUpdate) {
            const id = setTimeout(() => setPriceStr(newPriceStr), 0);
            return () => clearTimeout(id);
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





    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Price Section */}
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-base font-medium text-gray-900">Price <span className="text-red-500">*</span></label>
                        <div className="flex ">
                            <div className="relative ">
                                <select
                                    value={selectedCurrency}
                                    onChange={(e) => setSelectedCurrency(e.target.value)}
                                    className="appearance-none   border  bg-gray-50 border-gray-200 border-r-0 rounded-l-lg py-3 pl-4 pr-8 text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:border-green-500 h-11"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0  flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                            <Input
                                type="text"
                                value={priceStr}
                                onChange={handlePriceChange}
                                placeholder="0.00"
                                className="flex-1 w-full rounded-l-none border-l-0  "
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
                                            <Input
                                                type="text"
                                                value={breakdown.text || ""}
                                                onChange={(e) => handlePriceBreakdownChange(index, 'text', e.target.value)}
                                                placeholder="Package Name (e.g., Basic Logo Design)"
                                                className="flex-1 "
                                            />
                                            <div className="w-32 flex">
                                                <div className="bg-gray-100 border border-gray-200 border-r-0 h-11 rounded-l-lg px-3 flex items-center text-sm text-gray-600 font-medium">
                                                    {selectedCurrency}
                                                </div>
                                                <Input
                                                    type="text"
                                                    value={breakdown.price || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        handlePriceBreakdownChange(index, 'price', val);
                                                    }}
                                                    placeholder="0"
                                                    className="w-full rounded-l-none border-l-0"
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
                                                <Textarea
                                                    rows={3}
                                                    value={breakdown.included || ""}
                                                    onChange={(e) => handlePriceBreakdownChange(index, 'included', e.target.value)}
                                                    placeholder="List what's included (e.g., 2 Revisions, Source File)..."
                                                    className="w-full "
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
                                                    setIsManualPriceEdit(false); 
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

                        {/* Add New Button - max 5 price breakdowns */}
                        {priceBreakdowns.length < 5 && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (priceBreakdowns.length >= 5) return;
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
                        )}
                    </div>
                </div>


            </div>

            {/* Row 5: Payment methods - Saudi Arabia only (no region dropdown), checkboxes + description */}
            <div className="mb-6 space-y-4">
                <div>
                    <label className="block text-base font-medium text-gray-900">Payment methods</label>
                    <p className="text-sm text-gray-500 mt-0.5">Choose the payment methods you accept.</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-end">
                        {/* <label className="block text-sm font-medium text-gray-700">Accept these payment methods</label> */}
                        <button
                            type="button"
                            onClick={selectAllPaymentMethods}
                            className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline underline-offset-2"
                        >
                            Select all
                        </button>
                    </div>
                    <ul className="space-y-2 list-none p-0 m-0">
                        {regionMethods.map((method) => {
                            const isChecked = selectedSet.has(method.label);
                            return (
                                <li key={method.id}>
                                    <label
                                        className={`flex items-center gap-4 cursor-pointer rounded-xl border px-4 py-3.5 transition-all ${
                                            isChecked
                                                ? 'border-primary shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                                            <Input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => togglePaymentMethod(method.label)}
                                                className="sr-only"
                                            />
                                            {isChecked ? (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : null}
                                        </span>
                                        <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {method.label}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    {paymentMethods?.length > 0 && (
                        <p className="text-xs text-gray-500 pt-1">
                            {paymentMethods.length} method{paymentMethods.length !== 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment methods</label>
                    <Textarea
                        value={paymentMethodsText || ""}
                        onChange={(e) => setPaymentMethodsText(e.target.value)}
                        placeholder="e.g. I accept payments via quicklyway"
                        rows={3}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Row 6: Employment Status */}
                       {/* Row 6: Employment Status - same card style as payment methods */}
            <div className="mb-10">
                <label
                    className={`flex items-center gap-4 cursor-pointer rounded-xl border px-4 py-3.5 transition-all ${
                        availableForJob
                            ? 'border-primary shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                >
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${availableForJob ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                        <Input
                            type="checkbox"
                            checked={availableForJob}
                            onChange={(e) => setAvailableForJob(e.target.checked)}
                            className="sr-only"
                        />
                        {availableForJob ? (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : null}
                    </span>
                    <span className={`text-sm font-medium ${availableForJob ? 'text-gray-900' : 'text-gray-700'}`}>
                        I am ready for full-time employment
                    </span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={onSave}
                    disabled={isLoading}
                    className="flex-1  disabled:opacity-50 disabled:cursor-not-allowed "
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Service"
                    )}
                </Button>
            </div>
        </div>
    );
};

export default PostServicePrice;
