/**
 * ============================================================
 * CareerTwin AI – Main.java
 * Single-file Spring Boot Application
 *
 * Tech: Java 17+ · Spring Boot 3.x · Maven
 * Endpoints:
 * GET  /api/health
 * POST /api/analyze-resume
 * POST /api/readiness-score
 * POST /api/roadmap
 * GET  /api/admin/stats
 *
 * Run: mvn spring-boot:run
 * Port: http://localhost:8080
 * ============================================================
 */

package com.careertwin;

// ────────────────────────────────────────────────────────────
// Spring Boot + Web Imports
// ────────────────────────────────────────────────────────────
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.http.ResponseEntity;

// ────────────────────────────────────────────────────────────
// Standard Java Imports
// ────────────────────────────────────────────────────────────
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/* ============================================================
   APPLICATION ENTRY POINT
   ============================================================ */
@SpringBootApplication
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║   CareerTwin AI Backend – Running!       ║");
        System.out.println("║   http://localhost:8080/api/health        ║");
        System.out.println("╚══════════════════════════════════════════╝");
    }
}

/* ============================================================
   CORS CONFIGURATION
   Allows the frontend (served from any origin during dev)
   to call the Spring Boot APIs without CORS errors.

   For production: replace "*" with your actual frontend domain.
   ============================================================ */
@Configuration
class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(false);
        config.addAllowedOriginPattern("*");   // Allow all origins in dev
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}

/* ============================================================
   DTO CLASSES
   Data Transfer Objects for request/response JSON mapping
   ============================================================ */

// ── Request DTOs ─────────────────────────────────────────────

/**
 * Incoming student profile payload from the frontend.
 * Used by: /api/analyze-resume, /api/readiness-score, /api/roadmap
 */
class StudentRequest {
    private String       name;
    private String       branch;
    private String       year;
    private List<String> skills;

    // Getters & Setters
    public String       getName()   { return name; }
    public void         setName(String name) { this.name = name; }

    public String       getBranch() { return branch; }
    public void         setBranch(String branch) { this.branch = branch; }

    public String       getYear()   { return year; }
    public void         setYear(String year) { this.year = year; }

    public List<String> getSkills() { return skills != null ? skills : new ArrayList<>(); }
    public void         setSkills(List<String> skills) { this.skills = skills; }
}

// ── Response DTOs ────────────────────────────────────────────

/**
 * Resume analysis response.
 * Returned by: /api/analyze-resume
 */
class ResumeAnalysisResponse {
    private int          resumeScore;
    private List<String> strengths;
    private List<String> missingSkills;
    private String       analysisTime;

    public ResumeAnalysisResponse(int score, List<String> strengths, List<String> missing) {
        this.resumeScore   = score;
        this.strengths     = strengths;
        this.missingSkills = missing;
        this.analysisTime  = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));
    }

    public int          getResumeScore()   { return resumeScore; }
    public List<String> getStrengths()     { return strengths; }
    public List<String> getMissingSkills() { return missingSkills; }
    public String       getAnalysisTime()  { return analysisTime; }
}

/**
 * Placement readiness score response.
 * Returned by: /api/readiness-score
 */
class ReadinessResponse {
    private int    readinessScore;
    private int    skillMatch;
    private int    resumeQuality;
    private int    interviewReadiness;
    private String label;

    public ReadinessResponse(int readiness, int skill, int resume, int interview) {
        this.readinessScore     = readiness;
        this.skillMatch         = skill;
        this.resumeQuality      = resume;
        this.interviewReadiness = interview;
        this.label              = buildLabel(readiness);
    }

    private String buildLabel(int score) {
        if (score >= 90) return "Highly Placement Ready";
        if (score >= 75) return "Placement Ready";
        if (score >= 60) return "Almost Ready";
        if (score >= 40) return "Needs Improvement";
        return "Early Stage";
    }

    public int    getReadinessScore()     { return readinessScore; }
    public int    getSkillMatch()         { return skillMatch; }
    public int    getResumeQuality()      { return resumeQuality; }
    public int    getInterviewReadiness() { return interviewReadiness; }
    public String getLabel()              { return label; }
}

/**
 * Individual roadmap step.
 */
class RoadmapStep {
    private String level;
    private String course;
    private String icon;
    private String duration;

    public RoadmapStep(String level, String course, String icon, String duration) {
        this.level    = level;
        this.course   = course;
        this.icon     = icon;
        this.duration = duration;
    }

    public String getLevel()    { return level; }
    public String getCourse()   { return course; }
    public String getIcon()     { return icon; }
    public String getDuration() { return duration; }
}

/**
 * Full roadmap response.
 * Returned by: /api/roadmap
 */
class RoadmapResponse {
    private List<RoadmapStep> roadmap;
    private String            generatedFor;

    public RoadmapResponse(List<RoadmapStep> roadmap, String studentName) {
        this.roadmap      = roadmap;
        this.generatedFor = studentName;
    }

    public List<RoadmapStep> getRoadmap()      { return roadmap; }
    public String            getGeneratedFor() { return generatedFor; }
}

/**
 * Admin placement statistics response.
 * Returned by: /api/admin/stats
 */
class AdminStatsResponse {
    private int    totalStudents;
    private int    placementReady;
    private int    averageScore;
    private int    gapReports;
    private double placementPercentage;

    public AdminStatsResponse(int total, int ready, int avg, int gaps) {
        this.totalStudents       = total;
        this.placementReady      = ready;
        this.averageScore        = avg;
        this.gapReports          = gaps;
        this.placementPercentage = total > 0 ? Math.round((ready * 100.0 / total) * 10.0) / 10.0 : 0;
    }

    public int    getTotalStudents()       { return totalStudents; }
    public int    getPlacementReady()      { return placementReady; }
    public int    getAverageScore()        { return averageScore; }
    public int    getGapReports()          { return gapReports; }
    public double getPlacementPercentage() { return placementPercentage; }
}

/**
 * Generic health check / API response wrapper.
 */
class ApiResponse {
    private String status;
    private String message;
    private Object data;

    public ApiResponse(String status, String message) {
        this.status  = status;
        this.message = message;
    }

    public ApiResponse(String status, String message, Object data) {
        this.status  = status;
        this.message = message;
        this.data    = data;
    }

    public String getStatus()  { return status; }
    public String getMessage() { return message; }
    public Object getData()    { return data; }
}

/* ============================================================
   AI SERVICE (PLACEHOLDER)
   ============================================================ */
class AIService {

    public static ResumeAnalysisResponse analyzeResume(List<String> studentSkills, String branch) {
        List<String> requiredSkills = getRequiredSkillsByBranch(branch);

        List<String> strengths = new ArrayList<>(studentSkills);
        strengths.retainAll(requiredSkills.stream().map(String::toLowerCase).collect(java.util.stream.Collectors.toList()));
        if (strengths.isEmpty()) strengths = new ArrayList<>(studentSkills);

        List<String> missing = new ArrayList<>(requiredSkills);
        List<String> lowerStudentSkills = studentSkills.stream().map(String::toLowerCase).collect(java.util.stream.Collectors.toList());
        missing.removeIf(s -> lowerStudentSkills.stream().anyMatch(ss -> ss.contains(s.toLowerCase())));

        int coverage = requiredSkills.isEmpty() ? 80
            : (int) Math.min(95, (double) (requiredSkills.size() - missing.size()) / requiredSkills.size() * 100);

        if (strengths.isEmpty()) strengths.addAll(studentSkills);

        return new ResumeAnalysisResponse(coverage, strengths, missing);
    }

    public static ReadinessResponse calculateReadiness(StudentRequest req) {
        List<String> skills    = req.getSkills();
        int skillCount         = skills.size();

        int skillMatch         = Math.min(95, 50 + skillCount * 5);
        int resumeQuality      = Math.min(95, 60 + skillCount * 4);
        int interviewReadiness = Math.min(90, 40 + skillCount * 6);
        int overall            = (skillMatch + resumeQuality + interviewReadiness) / 3;

        return new ReadinessResponse(overall, skillMatch, resumeQuality, interviewReadiness);
    }

    public static RoadmapResponse generateRoadmap(StudentRequest req) {
        String branch = req.getBranch() != null ? req.getBranch() : "Computer Science";

        List<RoadmapStep> steps = new ArrayList<>();

        steps.add(new RoadmapStep("Beginner", "Java Fundamentals & OOP",         "🌱", "4 weeks"));
        steps.add(new RoadmapStep("Beginner", "Data Structures & Algorithms",      "📚", "6 weeks"));

        steps.add(new RoadmapStep("Intermediate", "Spring Boot REST Development",  "🚀", "5 weeks"));
        steps.add(new RoadmapStep("Intermediate", "MySQL & JPA / Hibernate",       "🗄️",  "3 weeks"));

        if (branch.toLowerCase().contains("data") || branch.toLowerCase().contains("computer")) {
            steps.add(new RoadmapStep("Advanced", "Azure AI Services & OpenAI",    "🤖", "6 weeks"));
            steps.add(new RoadmapStep("Advanced", "Docker · Kubernetes · CI/CD",   "🐳", "4 weeks"));
        } else {
            steps.add(new RoadmapStep("Advanced", "Cloud Architecture (Azure/AWS)","☁️",  "5 weeks"));
            steps.add(new RoadmapStep("Advanced", "System Design & Scalability",   "🏗️",  "4 weeks"));
        }

        return new RoadmapResponse(steps, req.getName() != null ? req.getName() : "Student");
    }

    // ── Helper: required skills per branch ───────────────────
    private static List<String> getRequiredSkillsByBranch(String branch) {
        if (branch == null) return List.of("Java", "Spring Boot", "SQL", "REST API", "Docker");
        return switch (branch.toLowerCase()) {
            case "data science" -> List.of("Python", "ML", "TensorFlow", "SQL", "Statistics");
            case "information technology", "computer science" -> List.of("Java", "Spring Boot", "SQL", "REST API", "Docker", "Azure AI");
            case "electronics & communication" -> List.of("Embedded C", "Python", "IoT", "MATLAB", "Signal Processing");
            default -> List.of("Java", "Spring Boot", "SQL", "Docker", "REST API");
        };
    }
}

/* ============================================================
   REST CONTROLLER
   All endpoints live under /api/*
   ============================================================ */
@RestController
@RequestMapping("/api")
class CareerTwinController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("service", "CareerTwin AI");
        info.put("version", "1.0.0");
        info.put("time",    LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        info.put("db",      "MySQL (configure in application.properties)");
        info.put("ai",      "Azure AI (configure endpoint in AIService)");

        return ResponseEntity.ok(new ApiResponse("ok", "CareerTwin AI is running", info));
    }

    @PostMapping("/analyze-resume")
    public ResponseEntity<?> analyzeResume(@RequestBody StudentRequest request) {
        if (request.getSkills() == null || request.getSkills().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse("error", "Skills list cannot be empty"));
        }

        try {
            ResumeAnalysisResponse result = AIService.analyzeResume(
                request.getSkills(),
                request.getBranch()
            );
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse("error", "Analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/readiness-score")
    public ResponseEntity<?> readinessScore(@RequestBody StudentRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse("error", "Student name is required"));
        }

        try {
            ReadinessResponse result = AIService.calculateReadiness(request);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse("error", "Score calculation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/roadmap")
    public ResponseEntity<?> generateRoadmap(@RequestBody StudentRequest request) {
        try {
            RoadmapResponse result = AIService.generateRoadmap(request);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse("error", "Roadmap generation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<AdminStatsResponse> adminStats() {
        AdminStatsResponse stats = new AdminStatsResponse(
            500,
            275,
            78,
            142
        );

        return ResponseEntity.ok(stats);
    }
}