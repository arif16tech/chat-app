import crypto from "crypto";

export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const otpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
