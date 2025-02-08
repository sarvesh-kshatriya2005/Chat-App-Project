const getDarkColor = (username) => {
  const darkColors = [
    "#1E3A8A", // Dark Blue
    "#7B1FA2", // Dark Purple
    "#B71C1C", // Dark Red
    "#004D40", // Dark Teal
    "#3E2723", // Dark Brown
    "#2C3E50", // Dark GrayBlue
    "#4A148C", // Deep Purple
    "#880E4F", // Deep PinkishRed
    "#006064", // Dark Cyan
    "#1B5E20", // Dark Green
    "#E65100", // Dark Orange
    "#3E2723", // Dark Brown
    "#BF360C", // Deep Orange
    "#4A148C", // Deep Purple
    
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return darkColors[Math.abs(hash) % darkColors.length];
};

const Avatar = ({ username,status }) => {
  const borderColor = status === "online" ? "green" : "darkgray";
  const bgColor = getDarkColor(username);
  const initials = username
    ? username
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: "white",
        height: "40px",
        width: "40px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "16px",
        border: `3px solid ${borderColor}`,
        textTransform: "uppercase",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
