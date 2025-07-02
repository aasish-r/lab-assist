# Lab Assist - Complete Setup Makefile
# Handles all dependencies, AI models, and configuration

.PHONY: all install install-deps install-ai setup-models test clean help
.DEFAULT_GOAL := help

# Configuration
OLLAMA_MODEL_LIGHT := phi3:mini
OLLAMA_MODEL_TINY := tinyllama:1.1b
GGUF_MODEL := phi-3-mini-4k-instruct.Q4_K_M.gguf
NODE_VERSION := 18
PYTHON_VERSION := 3.8

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Platform detection
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    PLATFORM := linux
endif
ifeq ($(UNAME_S),Darwin)
    PLATFORM := macos
endif
ifeq ($(OS),Windows_NT)
    PLATFORM := windows
endif

help: ## Show this help message
	@echo "$(BLUE)Lab Assist Setup$(NC)"
	@echo "================================"
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

all: install ## Complete setup (recommended)

install: check-deps install-deps install-ai setup-models test ## Full installation
	@echo "$(GREEN)✅ Lab Assist setup complete!$(NC)"
	@echo "$(YELLOW)Run 'make start' to launch the application$(NC)"

check-deps: ## Check system dependencies
	@echo "$(BLUE)🔍 Checking system dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)❌ Node.js not found. Please install Node.js $(NODE_VERSION)+$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)❌ npm not found$(NC)"; exit 1; }
	@echo "$(GREEN)✅ Node.js and npm found$(NC)"

install-deps: ## Install Node.js dependencies
	@echo "$(BLUE)📦 Installing Node.js dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

install-ai: ## Install AI runtime (Ollama or llama.cpp)
	@echo "$(BLUE)🤖 Setting up AI runtime...$(NC)"
	@if command -v ollama >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Ollama already installed$(NC)"; \
	else \
		$(MAKE) install-ollama; \
	fi

install-ollama: ## Install Ollama
	@echo "$(BLUE)📥 Installing Ollama...$(NC)"
ifeq ($(PLATFORM),linux)
	curl -fsSL https://ollama.ai/install.sh | sh
endif
ifeq ($(PLATFORM),macos)
	curl -fsSL https://ollama.ai/install.sh | sh
endif
ifeq ($(PLATFORM),windows)
	@echo "$(YELLOW)⚠️  Please download Ollama from https://ollama.ai/download$(NC)"
	@echo "$(YELLOW)   Then run 'make setup-models' after installation$(NC)"
	@exit 1
endif
	@echo "$(GREEN)✅ Ollama installed$(NC)"

setup-models: ## Download and configure AI models
	@echo "$(BLUE)🧠 Setting up AI models...$(NC)"
	@$(MAKE) setup-light-model

setup-light-model: ## Setup lightweight model (recommended)
	@echo "$(BLUE)📦 Downloading lightweight model (Phi-3 Mini ~2.3GB)...$(NC)"
	@if command -v ollama >/dev/null 2>&1; then \
		ollama pull $(OLLAMA_MODEL_LIGHT); \
		echo "$(GREEN)✅ Phi-3 Mini model ready$(NC)"; \
	else \
		echo "$(RED)❌ Ollama not found$(NC)"; \
		exit 1; \
	fi

setup-tiny-model: ## Setup ultra-lightweight model (~637MB)
	@echo "$(BLUE)📦 Downloading tiny model (TinyLlama ~637MB)...$(NC)"
	ollama pull $(OLLAMA_MODEL_TINY)
	@echo "$(GREEN)✅ TinyLlama model ready$(NC)"

setup-custom-model: ## Setup domain-specific optimized model
	@echo "$(BLUE)🎯 Setting up lab-optimized model...$(NC)"
	@$(MAKE) create-lab-model

create-lab-model: ## Create lab-specific fine-tuned model
	@echo "$(BLUE)🔬 Creating lab-specific model...$(NC)"
	@if [ ! -f "lab-commands.jsonl" ]; then \
		$(MAKE) generate-training-data; \
	fi
	@echo "$(YELLOW)📚 Training data created in lab-commands.jsonl$(NC)"
	@echo "$(YELLOW)🎓 Run 'ollama create lab-assist -f ./Modelfile' to create custom model$(NC)"

generate-training-data: ## Generate training data for lab commands
	@echo "$(BLUE)📝 Generating training data...$(NC)"
	@echo '{"prompt": "Parse: rat 5 cage 3 weight 280 grams", "completion": "{\\"intent\\": \\"record\\", \\"entities\\": {\\"rat\\": 5, \\"cage\\": 3, \\"weight\\": 280}}"}' > lab-commands.jsonl
	@echo '{"prompt": "Parse: weigh rat number five in cage three at two eighty", "completion": "{\\"intent\\": \\"record\\", \\"entities\\": {\\"rat\\": 5, \\"cage\\": 3, \\"weight\\": 280}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: change weight to 300 grams", "completion": "{\\"intent\\": \\"update\\", \\"entities\\": {\\"weight\\": 300}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: update the weight to three hundred", "completion": "{\\"intent\\": \\"update\\", \\"entities\\": {\\"weight\\": 300}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: move rat 7 to cage 12", "completion": "{\\"intent\\": \\"move\\", \\"entities\\": {\\"rat\\": 7, \\"cage\\": 12}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: move animal seven into cage twelve", "completion": "{\\"intent\\": \\"move\\", \\"entities\\": {\\"rat\\": 7, \\"cage\\": 12}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: show rats around 250 grams", "completion": "{\\"intent\\": \\"query\\", \\"entities\\": {\\"weight\\": 250}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: find animals around two fifty", "completion": "{\\"intent\\": \\"query\\", \\"entities\\": {\\"weight\\": 250}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: stop listening", "completion": "{\\"intent\\": \\"system\\", \\"entities\\": {\\"action\\": \\"stop\\"}}"}' >> lab-commands.jsonl
	@echo '{"prompt": "Parse: start recording", "completion": "{\\"intent\\": \\"system\\", \\"entities\\": {\\"action\\": \\"start\\"}}"}' >> lab-commands.jsonl
	@echo 'FROM phi3:mini' > Modelfile
	@echo '' >> Modelfile
	@echo 'PARAMETER temperature 0.1' >> Modelfile
	@echo 'PARAMETER top_p 0.9' >> Modelfile
	@echo '' >> Modelfile
	@echo 'SYSTEM """You are a lab command parser. Parse voice commands to JSON with intent and entities.' >> Modelfile
	@echo 'Valid intents: record, update, move, query, system' >> Modelfile
	@echo 'Example: "rat 5 cage 3 weight 280" -> {"intent": "record", "entities": {"rat": 5, "cage": 3, "weight": 280}}"""' >> Modelfile

install-llama-cpp: ## Install llama.cpp for ultra-fast inference
	@echo "$(BLUE)⚡ Installing llama.cpp...$(NC)"
	npm install @llama-node/llama-cpp
	@echo "$(BLUE)📥 Downloading GGUF model...$(NC)"
	@mkdir -p models
	@if [ ! -f "models/$(GGUF_MODEL)" ]; then \
		echo "$(BLUE)⬇️  Downloading $(GGUF_MODEL)...$(NC)"; \
		curl -L "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/$(GGUF_MODEL)" \
			-o "models/$(GGUF_MODEL)"; \
	fi
	@echo "$(GREEN)✅ llama.cpp setup complete$(NC)"

build: ## Build the application
	@echo "$(BLUE)🔨 Building application...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Build complete$(NC)"

test: build ## Test the application and AI models
	@echo "$(BLUE)🧪 Testing application...$(NC)"
	@if command -v ollama >/dev/null 2>&1; then \
		$(MAKE) test-ai; \
	fi
	@echo "$(BLUE)🧪 Running backend tests...$(NC)"
	node test-backend.js
	@echo "$(GREEN)✅ Tests complete$(NC)"

test-ai: ## Test AI model functionality
	@echo "$(BLUE)🤖 Testing AI model...$(NC)"
	@echo "Testing command: 'rat 5 cage 3 weight 280 grams'"
	@ollama run $(OLLAMA_MODEL_LIGHT) "Parse this lab command and return JSON: rat 5 cage 3 weight 280 grams" | head -5
	@echo "$(GREEN)✅ AI model test complete$(NC)"

start: ## Start the application
	@echo "$(BLUE)🚀 Starting Lab Assist...$(NC)"
	npm start

dev: ## Start in development mode
	@echo "$(BLUE)🛠️  Starting in development mode...$(NC)"
	npm run dev

benchmark: ## Benchmark different AI models
	@echo "$(BLUE)⏱️  Benchmarking AI models...$(NC)"
	@$(MAKE) benchmark-models

benchmark-models: ## Compare model performance
	@echo "$(BLUE)📊 Model Performance Comparison$(NC)"
	@echo "=================================="
	@echo "Testing: rat 5 cage 3 weight 280 grams"
	@echo ""
	@if ollama list | grep -q "phi3:mini"; then \
		echo "$(GREEN)Phi-3 Mini:$(NC)"; \
		time ollama run phi3:mini "Parse: rat 5 cage 3 weight 280 grams. Return JSON only." | head -3; \
		echo ""; \
	fi
	@if ollama list | grep -q "tinyllama"; then \
		echo "$(GREEN)TinyLlama:$(NC)"; \
		time ollama run tinyllama:1.1b "Parse: rat 5 cage 3 weight 280 grams. Return JSON only." | head -3; \
		echo ""; \
	fi

status: ## Show current setup status
	@echo "$(BLUE)📋 Lab Assist Status$(NC)"
	@echo "======================"
	@echo -n "Node.js: "
	@if command -v node >/dev/null 2>&1; then \
		echo "$(GREEN)✅ $(shell node --version)$(NC)"; \
	else \
		echo "$(RED)❌ Not installed$(NC)"; \
	fi
	@echo -n "npm: "
	@if command -v npm >/dev/null 2>&1; then \
		echo "$(GREEN)✅ $(shell npm --version)$(NC)"; \
	else \
		echo "$(RED)❌ Not installed$(NC)"; \
	fi
	@echo -n "Ollama: "
	@if command -v ollama >/dev/null 2>&1; then \
		echo "$(GREEN)✅ $(shell ollama --version 2>/dev/null || echo 'installed')$(NC)"; \
	else \
		echo "$(RED)❌ Not installed$(NC)"; \
	fi
	@echo "Models:"
	@if command -v ollama >/dev/null 2>&1; then \
		ollama list | grep -E "(phi3|tiny|llama)" | sed 's/^/  /' || echo "  $(YELLOW)⚠️  No models found$(NC)"; \
	else \
		echo "  $(RED)❌ Ollama not available$(NC)"; \
	fi

clean: ## Clean build artifacts and cache
	@echo "$(BLUE)🧹 Cleaning up...$(NC)"
	rm -rf node_modules dist .cache
	@if command -v ollama >/dev/null 2>&1; then \
		echo "$(YELLOW)🗑️  Remove AI models? [y/N]$(NC)"; \
		read -r response; \
		if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
			ollama rm $(OLLAMA_MODEL_LIGHT) 2>/dev/null || true; \
			ollama rm $(OLLAMA_MODEL_TINY) 2>/dev/null || true; \
			echo "$(GREEN)✅ AI models removed$(NC)"; \
		fi; \
	fi
	rm -f lab-commands.jsonl Modelfile ai-config.json
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

reinstall: clean install ## Clean reinstall

# Model size comparison
model-sizes: ## Show model size comparison
	@echo "$(BLUE)📏 AI Model Size Comparison$(NC)"
	@echo "================================"
	@echo "$(GREEN)Ultra Light:$(NC)"
	@echo "  TinyLlama 1.1B    ~637MB   ⚡ Fastest"
	@echo "  Phi-3 Mini        ~2.3GB   🎯 Recommended"
	@echo ""
	@echo "$(YELLOW)Medium:$(NC)"  
	@echo "  Llama 3.2 3B      ~2.0GB   🧠 Balanced"
	@echo "  Mistral 7B        ~4.1GB   📚 More capable"
	@echo ""
	@echo "$(RED)Heavy:$(NC)"
	@echo "  Llama 3.2 8B      ~4.7GB   🚀 High accuracy"
	@echo "  CodeLlama 13B     ~7.3GB   💻 Code-focused"

# Quick setup options
quick-light: install-deps setup-light-model build ## Quick setup with light model
	@echo "$(GREEN)🎉 Quick setup complete with Phi-3 Mini!$(NC)"

quick-tiny: install-deps setup-tiny-model build ## Quick setup with tiny model  
	@echo "$(GREEN)🎉 Quick setup complete with TinyLlama!$(NC)"

# Advanced setups
setup-llama-cpp: install-llama-cpp ## Setup with llama.cpp backend
	@echo "$(GREEN)🎉 llama.cpp setup complete!$(NC)"

# Development helpers
watch: ## Watch for changes and rebuild
	@echo "$(BLUE)👀 Watching for changes...$(NC)"
	npm run watch

lint: ## Run linter
	@echo "$(BLUE)🔍 Running linter...$(NC)"
	npm run lint

format: ## Format code
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	npm run format

# Docker setup (optional)
docker-build: ## Build Docker image
	@echo "$(BLUE)🐳 Building Docker image...$(NC)"
	docker build -t lab-assist .

docker-run: ## Run in Docker
	@echo "$(BLUE)🐳 Running in Docker...$(NC)"
	docker run -it --rm -p 3000:3000 lab-assist