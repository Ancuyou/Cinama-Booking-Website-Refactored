import apiClient from "./apiClient";

const handleApiResponse = (response) => {
  const responseData =
    response.data.data !== undefined ? response.data.data : response.data;
  const message = response.data.message || "Thành công";
  return { success: true, data: responseData, message };
};

const handleError = (error) => {
  const message = error.response?.data?.message || "Lỗi kết nối server";
  return { success: false, message };
};

class MovieService {
  // Lấy danh sách phim phân trang
  async getMoviesPaginated(page = 1) {
    try {
      const response = await apiClient.get(`/phim/pageable?page=${page}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API getMoviesPaginated:", error);
      return handleError(error);
    }
  }

  // Lấy chi tiết phim theo ID
  async getMovieById(movieId) {
    try {
      const response = await apiClient.get(`/phim/${movieId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API getMovieById:", error);
      return handleError(error);
    }
  }

  // Thêm phim mới
  async createMovie(movieData) {
    try {
      const response = await apiClient.post("/phim", movieData);
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API createMovie:", error);
      return handleError(error);
    }
  }

  // Cập nhật phim
  async updateMovie(movieId, movieData) {
    try {
      const response = await apiClient.put(`/phim/${movieId}`, movieData);
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API updateMovie:", error);
      return handleError(error);
    }
  }

  // Xóa phim
  async deleteMovie(movieId) {
    try {
      const response = await apiClient.delete(`/phim/${movieId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API deleteMovie:", error);
      return handleError(error);
    }
  }

  // Tìm kiếm phim theo từ khóa
  async searchMovies(keyword, page = 1) {
    try {
      const response = await apiClient.get(
        `/phim/search?keyword=${encodeURIComponent(keyword)}&page=${page}`
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API searchMovies:", error);
      return handleError(error);
    }
  }

  // Lấy thống kê phim
  async getMovieStats() {
    try {
      const response = await apiClient.get("/phim/stats");
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API getMovieStats:", error);
      return handleError(error);
    }
  }

  // Upload ảnh phim
  async uploadMovieImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const response = await apiClient.post("/phim/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error("Lỗi kết nối API uploadMovieImage:", error);
      return handleError(error);
    }
  }

  async getAllMovies() {
      try {
          const response = await apiClient.get(`/phim`);
          return handleApiResponse(response);
      } catch (error) {
          console.error("Lỗi kết nối API getAllMovies:", error);
          return handleError(error);
      }
  }

    async uploadMoviesExcel(selectedFile) {
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            const response = await apiClient.post(`/phim/upload-excel`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error("Lỗi kết nối API uploadMoviesExcel:", error);
            return handleError(error);
        }
    }
}

export default new MovieService();
