"use strict";

const Limiter = {

};

module.exports = {
  
  limit(strategy) {
    const limiter = Object.create(Limiter);
    limiter.strategy = strategy;
    return limiter;
  },

  strategy: {
    HIGH_USAGE: {
      limitPerSecond: 10,
      limitPerMinute: 300
    }
  }
};
