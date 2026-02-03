package com.example.MovieTicker.exception;

import java.sql.SQLIntegrityConstraintViolationException;
import java.util.HashMap;
import java.util.Map;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.example.MovieTicker.response.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<ApiResponse<String>> handleRuntimeException(RuntimeException ex) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setCode(400);
        apiResponse.setMessage(ex.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", 400);
        body.put("message", ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(SQLIntegrityConstraintViolationException.class)
    public ResponseEntity<?> handleSQLIntegrity(SQLIntegrityConstraintViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", 400);
        body.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }
    /**
     * Bắt lỗi validation cho tất cả các @RequestBody có annotation @Valid.
     * Phương thức này sẽ tự động được gọi khi validation thất bại.
     */
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        // Tạo một Map để chứa danh sách các lỗi
        // Key: tên trường bị lỗi, Value: thông báo lỗi
        Map<String, String> errors = new HashMap<>();
        // Lặp qua tất cả các lỗi và đưa vào Map
        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        // Lấy mã lỗi VALIDATION_ERROR đã tạo ở bước 1
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        // Xây dựng đối tượng ApiResponse để trả về cho frontend
        ApiResponse apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(errors) // Đính kèm chi tiết lỗi của từng trường
                .build();
        // Trả về response với HTTP status 400 Bad Request
        return ResponseEntity.badRequest().body(apiResponse);
    }
    // @Valid/@ModelAttribute binding errors
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(BindException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        ApiResponse<Map<String, String>> body = ApiResponse.<Map<String, String>>builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .data(errors)
                .build();
        return ResponseEntity.badRequest().body(body);
    }

    // Method parameter validation (e.g., @RequestParam/@PathVariable with @Validated)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
            errors.put(v.getPropertyPath().toString(), v.getMessage());
        }
        ApiResponse<Map<String, String>> body = ApiResponse.<Map<String, String>>builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .data(errors)
                .build();
        return ResponseEntity.badRequest().body(body);
    }
    // Fallback
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleUnknown(Exception ex) {
        ApiResponse<String> body = ApiResponse.<String>builder()
                .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("Internal server error")
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
