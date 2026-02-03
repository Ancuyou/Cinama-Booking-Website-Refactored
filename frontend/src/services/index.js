// src/services/index.js
import movieService from "./movieService";
import userService from "./userService";
import roomService from "./roomService";
import scheduleService from "./scheduleService";
import ticketService from "./ticketService";
import categoryService from "./categoryService";
import seatService from "./seatService";
import promotionService from "./promotionService";
import serviceService from "./serviceService";
import authService from "./authService"; // Thêm nếu chưa có
import settingService from "./settingService.js";
import reviewService from "./reviewService";

export {
  authService,
  movieService,
  userService,
  roomService,
  scheduleService,
  ticketService,
  categoryService,
  seatService,
  promotionService,
  serviceService,
  settingService,
  reviewService,
};
