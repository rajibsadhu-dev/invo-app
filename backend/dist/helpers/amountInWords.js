"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountInWords = amountInWords;
const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function chunkToWords(n) {
    if (n === 0)
        return "";
    if (n < 20)
        return ones[n];
    if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunkToWords(n % 100) : "");
}
function amountInWords(amount) {
    if (amount === 0)
        return "Zero Only";
    const intPart = Math.floor(amount);
    const decPart = Math.round((amount - intPart) * 100);
    const groups = [
        { divisor: 1000000000, label: "Billion" },
        { divisor: 1000000, label: "Million" },
        { divisor: 1000, label: "Thousand" },
        { divisor: 1, label: "" },
    ];
    let words = "";
    let remaining = intPart;
    for (const { divisor, label } of groups) {
        if (remaining >= divisor) {
            const count = Math.floor(remaining / divisor);
            words += (words ? " " : "") + chunkToWords(count) + (label ? " " + label : "");
            remaining %= divisor;
        }
    }
    if (decPart > 0) {
        words += " and " + chunkToWords(decPart) + " Cents";
    }
    return words + " Only";
}
//# sourceMappingURL=amountInWords.js.map