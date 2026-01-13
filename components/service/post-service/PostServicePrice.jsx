import React from 'react';
import { CURRENCIES } from '@/utils/constants';

const PostServicePrice = (props) => {
    const {
        priceStr, setPriceStr,
        selectedCurrency, setSelectedCurrency,
        priceBreakdowns, setPriceBreakdowns,
        scheduleData, setScheduleData,
        paymentMethods, setPaymentMethods,
        availableForJob, setAvailableForJob,
        onBack, onSave, onCancel,
        defaultPaymentMethods, defaultPriceBreakdowns
    } = props;

    const handlePriceChange = (e) => {
        let numericValue = e.target.value.replace(/[^0-9]/g, '');
        if (numericValue.length > 10) numericValue = numericValue.slice(0, 10);
        setPriceStr(numericValue);
    };

    const handlePriceBreakdownChange = (index, value) => {
        setPriceBreakdowns(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], text: value };
            return newItems;
        });
    };

    const handleScheduleChange = (index, field, value) => {
        setScheduleData(prev => {
            const newData = [...prev];
            if (field === 'isClosed') {
                newData[index] = { ...newData[index], isClosed: value, error: "" };
            } else {
                newData[index] = { ...newData[index], [field]: value };
            }
            return newData;
        });
    };

    const generateTimeOptions = () => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            const hour = i;
            const modifier = hour >= 12 ? 'PM' : 'AM';
            let displayHour = hour % 12;
            if (displayHour === 0) displayHour = 12;
            times.push(`${displayHour.toString().padStart(2, '0')}:00 ${modifier}`);
        }
        return times;
    };
    const timeOptions = generateTimeOptions();

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
                    <div className="space-y-3">
                        <label className="block text-base font-medium text-gray-900">Price breakdown</label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {priceBreakdowns.map((item, index) => (
                                <input
                                    key={item.id}
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => handlePriceBreakdownChange(index, e.target.value)}
                                    placeholder={defaultPriceBreakdowns[index]}
                                    className={`w-full px-6 py-4 text-base text-gray-700 placeholder-gray-400 outline-none focus:bg-gray-50 transition-colors ${index !== priceBreakdowns.length - 1 ? 'border-b border-gray-100' : ''
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Working Hours Section */}
                <div className="space-y-4">
                    <label className="block text-base font-medium text-gray-900">Working hours</label>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {scheduleData.map((item, index) => (
                            <div key={item.day} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
                                <div className="w-12 font-medium text-gray-700">{item.day}</div>

                                {item.isClosed ? (
                                    <div className="flex-1 flex justify-end">
                                        <span className="text-gray-400 text-sm mr-4">Unavailable</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-end gap-2">
                                        <div className="relative">
                                            <select
                                                value={item.startTime}
                                                onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                className={`appearance-none bg-white border ${item.error ? 'border-red-500' : 'border-gray-200'} rounded py-1 pl-2 pr-6 text-sm focus:outline-none focus:border-green-500`}
                                            >
                                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <span className="text-gray-400">-</span>
                                        <div className="relative">
                                            <select
                                                value={item.endTime}
                                                onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                className={`appearance-none bg-white border ${item.error ? 'border-red-500' : 'border-gray-200'} rounded py-1 pl-2 pr-6 text-sm focus:outline-none focus:border-green-500`}
                                            >
                                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleScheduleChange(index, 'isClosed', !item.isClosed)}
                                    className={`ml-4 w-10 h-6 rounded-full p-1 transition-colors ${!item.isClosed ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${!item.isClosed ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                        Times are in your local timezone
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
                    className="flex-1 py-3.5 bg-[#10b981] text-white rounded-full font-bold hover:bg-green-600 transition-colors shadow-sm"
                >
                    Save Service
                </button>
            </div>
        </div>
    );
};

export default PostServicePrice;
