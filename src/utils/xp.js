export function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level));
}

export function getLevelFromXp(totalXp) {
  let level = 0;
  let xpNeeded = 0;
  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += getXpForLevel(level);
  }
  return level - 1;
}

export function getXpProgress(totalXp) {
  let level = 0;
  let accumulatedXp = 0;
  while (true) {
    const needed = getXpForLevel(level + 1);
    if (accumulatedXp + needed > totalXp) {
      return {
        level,
        currentXp: totalXp - accumulatedXp,
        neededXp: needed,
        percentage: Math.floor(((totalXp - accumulatedXp) / needed) * 100),
      };
    }
    accumulatedXp += needed;
    level++;
  }
}

export function buildProgressBar(percentage, length = 20) {
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

export function randomXp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
