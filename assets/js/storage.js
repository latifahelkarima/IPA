/**
 * storage.js
 * Wrapper for localStorage to handle user progress
 */

const Storage = {
  PREFIX: 'edu_app_',

  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage', e);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return defaultValue;
    }
  },

  // Specific helpers
  saveProgress(materiId, progress) {
    const allProgress = this.get('progress', {});
    allProgress[materiId] = progress;
    this.save('progress', allProgress);
  },

  getProgress(materiId) {
    const allProgress = this.get('progress', {});
    return allProgress[materiId] || 0;
  },

  saveQuizScore(quizId, score) {
    const scores = this.get('quiz_scores', {});
    scores[quizId] = score;
    this.save('quiz_scores', scores);
  }
};
