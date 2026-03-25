'use strict';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysDiff(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sum(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0);
}

function stdDev(arr) {
  if (!arr || arr.length < 2) return 0;
  const mean = avg(arr);
  const sqDiffs = arr.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(avg(sqDiffs));
}

function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm === 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function pearsonR(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n: 0 };

  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);
  const xMean = avg(xSlice);
  const yMean = avg(ySlice);

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return { r: 0, n };
  return { r: Math.round((num / den) * 100) / 100, n };
}

function scoreToGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function getGreeting(firstName) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  return `Good ${time}, ${firstName || 'there'}!`;
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  getTodayString, addDays, daysDiff, getWeekStart,
  avg, sum, stdDev, computeBMI, computeAge,
  pearsonR, scoreToGrade, getGreeting, getDayOfYear, escapeHTML
};
