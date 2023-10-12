import jwt from "jsonwebtoken";
import { config } from "../config";

const jwtSecret = config.jwtSecret;

//extend jwt.Payload type
interface JwtDecoded extends jwt.JwtPayload {
  id: string;
}
export const verifyJwtToken = (token: string): JwtDecoded => {
  const decoded = jwt.verify(token, jwtSecret);
  return decoded as JwtDecoded;
};

// transform
