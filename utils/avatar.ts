export const getPlayerAvatar = (name: string, id?: string | number) => {
  const seed = encodeURIComponent(name || String(id || 'player'));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

