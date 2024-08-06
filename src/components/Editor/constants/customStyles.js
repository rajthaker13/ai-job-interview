export const customStyles = {
  control: (styles) => ({
    ...styles,
    width: "100%",
    maxWidth: "14rem",
    minWidth: "12rem",
    color: "white",
    fontSize: "0.8rem",
    lineHeight: "1.75rem",
    backgroundColor: "#262626",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#404040",
    },
  }),

  option: (styles) => {
    return {
      ...styles,
      color: "white",
      fontSize: "0.8rem",
      lineHeight: "1.75rem",
      width: "100%",
      background: "#404040",
    };
  },

  menu: (styles) => {
    return {
      ...styles,
      color: "white",
      backgroundColor: "#404040",
      maxWidth: "14rem",
    };
  },

  placeholder: (defaultStyles) => {
    return {
      ...defaultStyles,
      color: "white",
      fontSize: "0.8rem",
      lineHeight: "1.75rem",
    };
  },

  singleValue: (styles) => ({
    ...styles,
    color: "white", // Ensures the selected value is white
  }),

  valueContainer: (styles) => ({
    ...styles,
    color: "white", // Ensures the text inside the input is white
  }),
};
