/**
 * Converts a numeric amount to Indian Rupee Words
 * Example: 102999.00 -> "One Lakhs Two Thousand Nine Hundred and Ninety Nine Rupees only"
 * Matches physical reference invoice formatting for Sri Ram Transport
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n) {
  let word = '';
  if (n >= 100) {
    word += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    word += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    word += ONES[n] + ' ';
  }
  return word.trim();
}

export function numberToIndianWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  
  const num = Math.round(Number(amount));
  if (num === 0) return 'Zero Rupees only';
  
  let remainder = num;
  let words = '';

  // Crores (10,000,000)
  if (remainder >= 10000000) {
    const crores = Math.floor(remainder / 10000000);
    words += convertBelowThousand(crores) + ' Crores ';
    remainder %= 10000000;
  }

  // Lakhs (100,000)
  if (remainder >= 100000) {
    const lakhs = Math.floor(remainder / 100000);
    words += convertBelowThousand(lakhs) + ' Lakhs ';
    remainder %= 100000;
  }

  // Thousands (1,000)
  if (remainder >= 1000) {
    const thousands = Math.floor(remainder / 1000);
    words += convertBelowThousand(thousands) + ' Thousand ';
    remainder %= 1000;
  }

  // Hundreds & Below
  if (remainder > 0) {
    words += convertBelowThousand(remainder) + ' ';
  }

  return words.trim().replace(/\s+/g, ' ') + ' Rupees only';
}
