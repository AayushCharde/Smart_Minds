import { useState, useRef, useEffect } from 'react';
import { Target, Loader2, FileText, Sparkles, ChevronDown, Briefcase, PenLine } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// ─── Predefined Job Templates ──────────────────────────────────────
const JOB_TEMPLATES = [
  {
    title: 'Senior Python Developer',
    description: `We are looking for a Senior Python Developer to join our engineering team and build scalable backend systems.

Responsibilities:
- Design, develop, and maintain high-performance Python applications and APIs
- Architect microservices and distributed systems using Flask/FastAPI/Django
- Write clean, testable, and well-documented code following best practices
- Optimize database queries and implement caching strategies
- Mentor junior developers and conduct code reviews
- Collaborate with cross-functional teams to deliver product features

Requirements:
- 5+ years of professional Python development experience
- Strong proficiency with web frameworks (Flask, FastAPI, or Django)
- Experience with SQL databases (PostgreSQL, MySQL) and ORMs (SQLAlchemy)
- Familiarity with message queues (RabbitMQ, Kafka, Redis)
- Experience with Docker, CI/CD pipelines, and cloud platforms (AWS/GCP/Azure)
- Solid understanding of RESTful API design and microservices architecture

Nice to Have:
- Experience with async Python (asyncio, aiohttp)
- Knowledge of data engineering tools (Airflow, Spark)
- Contributions to open-source projects
- AWS/GCP certifications`,
  },
  {
    title: 'Frontend React Developer',
    description: `We are seeking a talented Frontend React Developer to create exceptional user interfaces and deliver pixel-perfect web experiences.

Responsibilities:
- Build responsive, accessible, and performant UI components using React
- Implement state management solutions (Redux, Context API, Zustand)
- Collaborate with designers to translate Figma/Sketch mockups into production code
- Write unit and integration tests using Jest and React Testing Library
- Optimize bundle size, rendering performance, and Core Web Vitals
- Participate in sprint planning, code reviews, and architectural discussions

Requirements:
- 3+ years of experience with React.js and modern JavaScript (ES6+)
- Strong proficiency in HTML5, CSS3, and responsive design
- Experience with TypeScript in production applications
- Familiarity with build tools (Vite, Webpack) and CSS frameworks (Tailwind, Styled Components)
- Understanding of REST APIs, GraphQL, and data fetching patterns
- Knowledge of browser developer tools, performance profiling, and debugging

Nice to Have:
- Experience with Next.js or Remix
- Familiarity with animation libraries (Framer Motion, GSAP)
- Understanding of accessibility standards (WCAG 2.1)
- Experience with design systems and component libraries`,
  },
  {
    title: 'Full Stack Engineer',
    description: `We are hiring a Full Stack Engineer to own features end-to-end, from database to user interface, in a fast-paced product team.

Responsibilities:
- Develop full-stack features spanning frontend (React/Vue) and backend (Node.js/Python)
- Design and implement RESTful APIs and database schemas
- Build reusable components and libraries for future use
- Ensure application security, scalability, and reliability
- Write comprehensive tests across the full stack
- Deploy and monitor applications in cloud environments

Requirements:
- 4+ years of full-stack development experience
- Proficiency in JavaScript/TypeScript for both frontend and backend
- Experience with React or Vue.js for frontend development
- Backend experience with Node.js (Express/NestJS) or Python (Flask/Django)
- Strong SQL skills with PostgreSQL or MySQL; familiarity with NoSQL databases
- Experience with Git, CI/CD, Docker, and cloud services (AWS/GCP)

Nice to Have:
- Experience with serverless architectures (Lambda, Cloud Functions)
- Knowledge of infrastructure-as-code (Terraform, CloudFormation)
- Experience with real-time systems (WebSockets, SSE)
- Familiarity with monitoring tools (Datadog, Grafana, Sentry)`,
  },
  {
    title: 'Data Scientist',
    description: `We are looking for a Data Scientist to uncover insights from complex datasets and build predictive models that drive business decisions.

Responsibilities:
- Analyze large-scale datasets to identify trends, patterns, and anomalies
- Build and deploy machine learning models for classification, regression, and clustering
- Design A/B experiments and perform statistical hypothesis testing
- Create dashboards and visualizations to communicate findings to stakeholders
- Collaborate with engineering teams to productionize ML models
- Stay current with research in ML/AI and evaluate new techniques

Requirements:
- 3+ years of experience in data science or machine learning
- Strong proficiency in Python (pandas, NumPy, scikit-learn, matplotlib)
- Experience with ML frameworks (TensorFlow, PyTorch, or XGBoost)
- Solid foundation in statistics, probability, and experimental design
- SQL proficiency for data extraction and transformation
- Experience with Jupyter notebooks and data visualization tools

Nice to Have:
- Experience with NLP, computer vision, or time-series forecasting
- Familiarity with MLOps tools (MLflow, Kubeflow, Weights & Biases)
- Knowledge of big data technologies (Spark, Hadoop)
- Published research or Kaggle competition experience`,
  },
  {
    title: 'DevOps / Cloud Engineer',
    description: `We are seeking a DevOps / Cloud Engineer to design and maintain our cloud infrastructure, CI/CD pipelines, and platform reliability.

Responsibilities:
- Design, build, and maintain cloud infrastructure on AWS/GCP/Azure
- Implement and optimize CI/CD pipelines for automated testing and deployment
- Manage containerized applications using Docker and Kubernetes
- Set up monitoring, alerting, and logging systems for production environments
- Implement security best practices and compliance standards
- Automate infrastructure provisioning using Infrastructure-as-Code tools

Requirements:
- 4+ years of DevOps or Cloud Engineering experience
- Strong expertise with at least one major cloud provider (AWS, GCP, or Azure)
- Proficiency with Docker, Kubernetes, and container orchestration
- Experience with Infrastructure-as-Code (Terraform, Pulumi, or CloudFormation)
- Hands-on experience with CI/CD tools (Jenkins, GitHub Actions, GitLab CI)
- Strong Linux systems administration and scripting skills (Bash, Python)

Nice to Have:
- AWS Solutions Architect or equivalent cloud certification
- Experience with service mesh (Istio, Linkerd)
- Knowledge of GitOps practices (ArgoCD, Flux)
- Experience with cost optimization and FinOps practices`,
  },
  {
    title: 'Machine Learning Engineer',
    description: `We are looking for a Machine Learning Engineer to bridge the gap between research and production, building scalable ML systems that power our products.

Responsibilities:
- Design and implement ML pipelines from data ingestion to model serving
- Train, evaluate, and optimize machine learning models at scale
- Build robust feature engineering and data processing pipelines
- Deploy models to production with monitoring and A/B testing capabilities
- Collaborate with data scientists to translate prototypes into production systems
- Optimize model inference for latency, throughput, and cost

Requirements:
- 3+ years of experience in machine learning engineering
- Strong Python skills with ML frameworks (PyTorch, TensorFlow, JAX)
- Experience with ML pipeline tools (Airflow, Kubeflow, MLflow)
- Proficiency in model deployment and serving (TensorFlow Serving, Triton, BentoML)
- Experience with cloud platforms (AWS SageMaker, GCP Vertex AI)
- Strong software engineering practices (testing, version control, code review)

Nice to Have:
- Experience with LLMs and generative AI (fine-tuning, RAG, prompt engineering)
- Knowledge of distributed training (Horovod, DeepSpeed)
- Experience with real-time ML inference at scale
- Contributions to open-source ML projects`,
  },
  {
    title: 'Backend Java Developer',
    description: `We are hiring a Backend Java Developer to design and build enterprise-grade backend services and APIs in a high-availability environment.

Responsibilities:
- Develop and maintain scalable Java-based microservices and APIs
- Design database schemas and optimize query performance
- Implement event-driven architectures using Kafka or RabbitMQ
- Write comprehensive unit and integration tests
- Participate in system design reviews and architectural decision-making
- Ensure code quality through code reviews and adherence to standards

Requirements:
- 4+ years of professional Java development (Java 11+)
- Strong experience with Spring Boot and Spring Framework ecosystem
- Proficiency with relational databases (PostgreSQL, MySQL) and Hibernate/JPA
- Experience with microservices architecture and RESTful API design
- Familiarity with build tools (Maven/Gradle) and CI/CD pipelines
- Understanding of concurrency, multithreading, and JVM performance tuning

Nice to Have:
- Experience with reactive programming (Spring WebFlux, Project Reactor)
- Knowledge of Kubernetes and cloud-native Java (Quarkus, Micronaut)
- Experience with GraphQL or gRPC
- AWS/Azure certifications`,
  },
  {
    title: 'UI/UX Designer',
    description: `We are looking for a creative UI/UX Designer to craft intuitive and visually compelling digital experiences across web and mobile platforms.

Responsibilities:
- Conduct user research, interviews, and usability testing to inform design decisions
- Create wireframes, prototypes, and high-fidelity mockups using Figma or Sketch
- Design consistent UI components and maintain the design system
- Collaborate with developers to ensure pixel-perfect implementation
- Analyze user behavior data to iterate on designs and improve conversions
- Present design concepts to stakeholders and incorporate feedback

Requirements:
- 3+ years of UI/UX design experience for web and mobile applications
- Expert proficiency in Figma (or Sketch) and prototyping tools
- Strong portfolio demonstrating user-centered design process
- Understanding of design systems, accessibility (WCAG), and responsive design
- Experience with user research methodologies and usability testing
- Knowledge of HTML/CSS basics for effective developer collaboration

Nice to Have:
- Experience with motion design and micro-interactions
- Familiarity with front-end frameworks (React, Vue) for prototyping
- Experience with data visualization design
- Knowledge of design tokens and design-to-code workflows`,
  },
  {
    title: 'QA / Test Automation Engineer',
    description: `We are seeking a QA / Test Automation Engineer to ensure product quality through comprehensive testing strategies and automation frameworks.

Responsibilities:
- Design and implement automated test suites for web and API testing
- Develop and maintain test automation frameworks from scratch
- Perform manual exploratory testing for complex user flows
- Create detailed test plans, test cases, and bug reports
- Integrate automated tests into CI/CD pipelines for continuous testing
- Collaborate with developers to identify and fix defects early in the cycle

Requirements:
- 3+ years of experience in software testing and test automation
- Proficiency in test automation frameworks (Selenium, Cypress, Playwright)
- Experience with API testing tools (Postman, REST Assured)
- Strong programming skills in Python, JavaScript, or Java
- Knowledge of CI/CD integration for automated testing (Jenkins, GitHub Actions)
- Understanding of Agile/Scrum methodologies and QA processes

Nice to Have:
- Experience with performance testing (JMeter, k6, Locust)
- Knowledge of mobile testing (Appium, Detox)
- ISTQB or similar testing certification
- Experience with BDD frameworks (Cucumber, Behave)`,
  },
  {
    title: 'Product Manager',
    description: `We are hiring a Product Manager to define product strategy, prioritize features, and drive cross-functional execution from ideation to launch.

Responsibilities:
- Define and communicate product vision, strategy, and roadmap
- Gather and prioritize requirements from customers, stakeholders, and market research
- Write clear PRDs (Product Requirements Documents) and user stories
- Work closely with engineering, design, and marketing teams to deliver features
- Analyze product metrics, KPIs, and user feedback to guide decisions
- Conduct competitive analysis and identify market opportunities

Requirements:
- 4+ years of product management experience in a technology company
- Proven track record of shipping successful products or features
- Strong analytical skills with experience in data-driven decision making
- Excellent communication and stakeholder management abilities
- Experience with product tools (Jira, Linear, Amplitude, Mixpanel)
- Understanding of software development processes and Agile methodologies

Nice to Have:
- Technical background or experience working with APIs and data platforms
- Experience with B2B SaaS or marketplace products
- MBA or equivalent business education
- Experience with AI/ML product development`,
  },
];

// ─── Component ─────────────────────────────────────────────────────
export default function JDInput({ onAnalyze, loading, initialTitle = '', initialDescription = '', onTitleChange, onDescriptionChange }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null); // null = nothing selected, 'custom' = custom mode
  const [isCustom, setIsCustom] = useState(false);
  const dropdownRef = useRef(null);

  // Determine initial state from props
  useEffect(() => {
    if (initialTitle) {
      const match = JOB_TEMPLATES.find(t => t.title === initialTitle);
      if (match) {
        setSelectedPreset(match.title);
        setIsCustom(false);
      } else {
        setSelectedPreset('custom');
        setIsCustom(true);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleChange = (val) => {
    setTitle(val);
    onTitleChange?.(val);
  };

  const handleDescChange = (val) => {
    setDescription(val);
    onDescriptionChange?.(val);
  };

  const handleSelectPreset = (template) => {
    setSelectedPreset(template.title);
    setIsCustom(false);
    setIsDropdownOpen(false);
    setTitle(template.title);
    setDescription(template.description);
    onTitleChange?.(template.title);
    onDescriptionChange?.(template.description);
  };

  const handleSelectCustom = () => {
    setSelectedPreset('custom');
    setIsCustom(true);
    setIsDropdownOpen(false);
    setTitle('');
    setDescription('');
    onTitleChange?.('');
    onDescriptionChange?.('');
  };

  const handleSubmit = () => {
    if (description.trim()) {
      onAnalyze({ title: title.trim() || 'Untitled Job', description: description.trim() });
    }
  };

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;

  // Determine display label for the dropdown trigger
  const displayLabel = selectedPreset === 'custom'
    ? (title || 'Custom Job Title')
    : selectedPreset || 'Select a Job Role...';

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.cardShadow,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: theme.colors.accentLight }}
        >
          <FileText size={15} style={{ color: theme.colors.accent }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
            Job Description
          </h3>
          <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
            Select a role or write a custom JD to match candidates
          </p>
        </div>
      </div>

      {/* Job Title Dropdown */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.colors.textMuted }}>
          Job Role
        </label>
        <div ref={dropdownRef} className="relative">
          {/* Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 text-left"
            style={{
              backgroundColor: theme.colors.bgInput,
              color: selectedPreset ? theme.colors.textPrimary : theme.colors.textMuted,
              border: `1px solid ${isDropdownOpen ? theme.colors.borderFocus : theme.colors.border}`,
              boxShadow: isDropdownOpen ? `0 0 0 3px ${theme.colors.accent}15` : 'none',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedPreset && selectedPreset !== 'custom' ? (
                <Briefcase size={14} className="flex-shrink-0" style={{ color: theme.colors.accent }} />
              ) : selectedPreset === 'custom' ? (
                <PenLine size={14} className="flex-shrink-0" style={{ color: theme.colors.warning || theme.colors.accent }} />
              ) : null}
              <span className="truncate">{displayLabel}</span>
            </div>
            <ChevronDown
              size={16}
              className="flex-shrink-0 transition-transform duration-200"
              style={{
                color: theme.colors.textMuted,
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden animate-slide-up"
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: `0 12px 40px -8px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)`,
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {/* Preset Templates */}
              {JOB_TEMPLATES.map((template, index) => {
                const isSelected = selectedPreset === template.title;
                return (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => handleSelectPreset(template)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? `${theme.colors.accent}12` : 'transparent',
                      borderBottom: index < JOB_TEMPLATES.length - 1 ? `1px solid ${theme.colors.border}30` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = `${theme.colors.accent}08`;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? `${theme.colors.accent}20` : theme.colors.bgTertiary,
                      }}
                    >
                      <Briefcase size={13} style={{ color: isSelected ? theme.colors.accent : theme.colors.textMuted }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: isSelected ? theme.colors.accent : theme.colors.textPrimary }}
                      >
                        {template.title}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.colors.accent }}
                      >
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: theme.colors.border }} />

              {/* Custom Option */}
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-150"
                style={{
                  backgroundColor: isCustom ? `${theme.colors.accent}12` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isCustom) e.currentTarget.style.backgroundColor = `${theme.colors.accent}08`;
                }}
                onMouseLeave={(e) => {
                  if (!isCustom) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isCustom ? `${theme.colors.accent}20` : theme.colors.bgTertiary,
                  }}
                >
                  <PenLine size={13} style={{ color: isCustom ? theme.colors.accent : theme.colors.textMuted }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: isCustom ? theme.colors.accent : theme.colors.textPrimary }}
                  >
                    Custom Job Title
                  </p>
                  <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                    Write your own title and description
                  </p>
                </div>
                {isCustom && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: theme.colors.accent }}
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Title Input — only visible when "Custom" is selected */}
      {isCustom && (
        <div className="mb-3 animate-slide-up">
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.colors.textMuted }}>
            Custom Job Title
          </label>
          <input
            type="text"
            placeholder="e.g., Senior AI/ML Platform Engineer"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
            style={{
              backgroundColor: theme.colors.bgInput,
              color: theme.colors.textPrimary,
              border: `1px solid ${theme.colors.border}`,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.borderFocus;
              e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accent}15`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border;
              e.target.style.boxShadow = 'none';
            }}
            autoFocus
          />
        </div>
      )}

      {/* Description */}
      <div className="flex-1 flex flex-col mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
            Description
          </label>
          <div className="flex items-center gap-2">
            {selectedPreset && selectedPreset !== 'custom' && description && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${theme.colors.success}15`,
                  color: theme.colors.success,
                }}
              >
                Auto-filled
              </span>
            )}
            <span
              className="text-[10px] tabular-nums"
              style={{ color: wordCount > 50 ? theme.colors.success : theme.colors.textMuted }}
            >
              {wordCount} words
            </span>
          </div>
        </div>
        <textarea
          placeholder={
            isCustom
              ? 'Write or paste the full job description including requirements, responsibilities, and qualifications...'
              : 'Select a job role above to auto-fill, or choose "Custom" to write your own...'
          }
          value={description}
          onChange={(e) => handleDescChange(e.target.value)}
          className="w-full flex-1 px-3 py-2.5 rounded-lg text-sm outline-none resize-none min-h-[300px] transition-all duration-150"
          style={{
            backgroundColor: theme.colors.bgInput,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.borderFocus;
            e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accent}15`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!description.trim() || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        style={{
          background: loading
            ? theme.colors.accent
            : `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
          color: theme.colors.textOnAccent,
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analyzing & Scoring...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Analyze & Match
          </>
        )}
      </button>
    </div>
  );
}
