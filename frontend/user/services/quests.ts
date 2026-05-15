import api from "./api";

export const questService = {
  getActive: () => api.get("/quests/active"),
  getLeaderboard: (limit = 50) => api.get(`/leaderboard?limit=${limit}`),
};
