package com.example.demo.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // Wrap the request and response to allow reading their content multiple times if needed
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        try {
            // Proceed with the next filter in the chain
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            logRequestAndResponse(requestWrapper, responseWrapper, duration);

            // Important: copy the cached response body back to the actual response
            responseWrapper.copyBodyToResponse();
        }
    }

    private void logRequestAndResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, long duration) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        String fullUrl = queryString != null ? uri + "?" + queryString : uri;
        int status = response.getStatus();

        // Skip logging for common static or noisy endpoints if needed (e.g., /ws, /actuator)
        if (uri.startsWith("/ws")) {
            return;
        }

        // Log the basic request/response info
        logger.info("--> {} {} | Status: {} | Time: {}ms", method, fullUrl, status, duration);

        // Optionally, log request payload for debugging (can be noisy)
        // String requestPayload = getPayload(request.getContentAsByteArray(), request.getCharacterEncoding());
        // if (!requestPayload.isEmpty()) {
        //     logger.debug("Request Payload: {}", requestPayload);
        // }
    }

    private String getPayload(byte[] buf, String characterEncoding) {
        if (buf.length > 0) {
            try {
                int length = Math.min(buf.length, 1024); // Limit logged payload size
                return new String(buf, 0, length, characterEncoding);
            } catch (UnsupportedEncodingException ex) {
                return "[Unsupported Encoding]";
            }
        }
        return "";
    }
}
