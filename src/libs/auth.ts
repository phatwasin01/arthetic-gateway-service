import jwt from "jsonwebtoken";
import { config } from "../config";

const jwtSecret = config.JWT_SECRET || "secret";

//extend jwt.Payload type
interface JwtDecoded extends jwt.JwtPayload {
  id: string;
}
export const verifyJwtToken = (token: string): JwtDecoded => {
  const decoded = jwt.verify(token, jwtSecret);
  return decoded as JwtDecoded;
};
