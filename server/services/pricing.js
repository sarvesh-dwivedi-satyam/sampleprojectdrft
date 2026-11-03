function calculateTotals(items, configuration = process.env) {
    const taxBasisPoints = Number(configuration.TAX_RATE_BASIS_POINTS || 0);
    const deliveryPaise = Number(configuration.DELIVERY_FEE_PAISE || 0);
    if (!Number.isSafeInteger(taxBasisPoints) || taxBasisPoints < 0 || taxBasisPoints > 10_000 ||
        !Number.isSafeInteger(deliveryPaise) || deliveryPaise < 0) {
        throw new Error('Tax or delivery configuration is invalid.');
    }
    const subtotalPaise = items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.price_paise);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(price) || price < 0) {
            throw new Error('An order item has invalid pricing data.');
        }
        return sum + quantity * price;
    }, 0);
    const taxPaise = Math.round(subtotalPaise * taxBasisPoints / 10_000);
    const totalPaise = subtotalPaise + taxPaise + deliveryPaise;
    if (![subtotalPaise, taxPaise, totalPaise].every(Number.isSafeInteger)) {
        throw new Error('Order total exceeds the supported amount.');
    }
    return { subtotalPaise, taxPaise, deliveryPaise, totalPaise };
}

module.exports = { calculateTotals };
