"""
Unified LLM Handler for Claude and OpenAI
Provides a consistent interface for both providers with automatic fallback
Based on reference implementation
"""
import os
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

# LLM Client imports
from openai import OpenAI
from anthropic import Anthropic

from app.config import settings

# Setup logging
logger = logging.getLogger(__name__)


class LLMHandler:
    """
    Unified handler for Claude and OpenAI APIs with automatic fallback
    """

    # Default models - Using Claude Sonnet 4 for best performance
    DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
    DEFAULT_OPENAI_MODEL = "gpt-4o"

    def __init__(
        self,
        llm_provider: str = None,
        model: Optional[str] = None,
        claude_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        """
        Initialize LLM Handler

        Args:
            llm_provider: "claude", "openai", or "custom" (defaults to settings)
            model: Specific model to use (if None, uses default for provider)
            claude_api_key: Claude API key (if None, reads from settings)
            openai_api_key: OpenAI API key (if None, reads from settings)
        """
        self.llm_provider = (llm_provider or settings.DEFAULT_LLM_PROVIDER).lower()

        # Get API keys from settings if not provided
        self.claude_api_key = claude_api_key or settings.ANTHROPIC_API_KEY
        self.openai_api_key = openai_api_key or settings.OPENAI_API_KEY

        # Custom LLM settings
        self.custom_endpoint = settings.CUSTOM_LLM_ENDPOINT
        self.custom_api_key = settings.CUSTOM_LLM_API_KEY
        self.custom_model = settings.CUSTOM_LLM_MODEL

        # Initialize clients
        self.claude_client = None
        self.openai_client = None
        self.custom_client = None

        # Set model
        if model:
            self.model = model
        else:
            if self.llm_provider == "claude":
                self.model = settings.CLAUDE_MODEL
            elif self.llm_provider == "custom":
                self.model = self.custom_model
            else:
                self.model = settings.OPENAI_MODEL

        # Initialize primary client
        self._initialize_clients()

        logger.info(f"LLM Handler initialized with provider: {self.llm_provider}, model: {self.model}")

    def _initialize_clients(self):
        """Initialize API clients"""
        # Try to initialize Claude client
        if self.claude_api_key:
            try:
                self.claude_client = Anthropic(api_key=self.claude_api_key)
                logger.info("Claude client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Claude client: {str(e)}")
                self.claude_client = None

        # Try to initialize OpenAI client
        if self.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {str(e)}")
                self.openai_client = None

        # Try to initialize Custom LLM client (OpenAI-compatible endpoint)
        if self.custom_endpoint:
            try:
                self.custom_client = OpenAI(
                    base_url=self.custom_endpoint,
                    api_key=self.custom_api_key or "not-needed"
                )
                logger.info(f"Custom LLM client initialized: {self.custom_endpoint} / {self.custom_model}")
            except Exception as e:
                logger.warning(f"Failed to initialize Custom LLM client: {str(e)}")
                self.custom_client = None

    def _call_claude(self, messages: list, max_tokens: int = 8000) -> str:
        """
        Call Claude API

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens in response

        Returns:
            str: Response text
        """
        if not self.claude_client:
            raise Exception("Claude client not initialized. Check API key.")

        try:
            import time as _time
            t0 = _time.time()
            logger.info(f"[LLM] Calling Claude API | model={self.model} | max_tokens={max_tokens}")
            print(f"[LLM_HANDLER] Calling Claude: model={self.model} max_tokens={max_tokens}", flush=True)

            system_message = ""
            user_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    user_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })

            if not user_messages:
                user_messages = [{"role": "user", "content": messages[0]["content"]}]

            kwargs = {
                "model": self.model,
                "max_tokens": max_tokens,
                "messages": user_messages
            }

            if system_message:
                kwargs["system"] = system_message

            response = self.claude_client.messages.create(**kwargs)

            result = response.content[0].text
            elapsed = _time.time() - t0
            logger.info(f"[LLM] Claude response: {len(result)} chars in {elapsed:.1f}s")
            print(f"[LLM_HANDLER] Claude SUCCESS: {len(result)} chars in {elapsed:.1f}s", flush=True)
            return result

        except Exception as e:
            logger.error(f"[LLM] Claude API call failed: {str(e)}")
            print(f"[LLM_HANDLER] Claude FAILED: {e}", flush=True)
            raise

    def _call_openai(self, messages: list, max_tokens: int = 8000) -> str:
        """
        Call OpenAI API

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens in response

        Returns:
            str: Response text
        """
        if not self.openai_client:
            raise Exception("OpenAI client not initialized. Check API key.")

        try:
            import time as _time
            t0 = _time.time()
            logger.info(f"[LLM] Calling OpenAI API | model={self.model} | max_tokens={max_tokens}")
            print(f"[LLM_HANDLER] Calling OpenAI: model={self.model} max_tokens={max_tokens}", flush=True)

            if self.model.startswith("o1"):
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_completion_tokens=max_tokens
                )
            else:
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens
                )

            result = response.choices[0].message.content.strip()
            elapsed = _time.time() - t0
            logger.info(f"[LLM] OpenAI response: {len(result)} chars in {elapsed:.1f}s")
            print(f"[LLM_HANDLER] OpenAI SUCCESS: {len(result)} chars in {elapsed:.1f}s", flush=True)
            return result

        except Exception as e:
            logger.error(f"[LLM] OpenAI API call failed: {str(e)}")
            print(f"[LLM_HANDLER] OpenAI FAILED: {e}", flush=True)
            raise

    def _call_custom(self, messages: list, max_tokens: int = 8000) -> str:
        """Call Custom LLM (Ollama / self-hosted OpenAI-compatible endpoint)"""
        if not self.custom_client:
            raise Exception("Custom LLM client not initialized. Check CUSTOM_LLM_ENDPOINT.")

        try:
            import time as _time
            t0 = _time.time()
            model = self.custom_model if self.llm_provider == "custom" else self.model
            logger.info(f"[LLM] Calling Custom LLM | endpoint={self.custom_endpoint} | model={model} | max_tokens={max_tokens}")
            print(f"[LLM_HANDLER] Calling Custom: model={model} max_tokens={max_tokens}", flush=True)

            response = self.custom_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.3,
            )

            result = response.choices[0].message.content.strip()
            elapsed = _time.time() - t0
            logger.info(f"[LLM] Custom LLM response: {len(result)} chars in {elapsed:.1f}s")
            print(f"[LLM_HANDLER] Custom SUCCESS: {len(result)} chars in {elapsed:.1f}s", flush=True)
            return result

        except Exception as e:
            logger.error(f"[LLM] Custom LLM call failed: {str(e)}")
            print(f"[LLM_HANDLER] Custom FAILED: {e}", flush=True)
            raise

    def _call_custom_with_usage(self, messages: list, max_tokens: int) -> Dict[str, Any]:
        """Call Custom LLM and return text + token usage."""
        if not self.custom_client:
            raise Exception("Custom LLM client not initialized.")

        import time as _time
        model = self.custom_model if self.llm_provider == "custom" else self.model
        t0 = _time.time()
        logger.info(f"[LLM] Calling Custom (with_usage) | model={model} | max_tokens={max_tokens}")
        print(f"[LLM_HANDLER] Calling Custom (with_usage): model={model} max_tokens={max_tokens}", flush=True)

        response = self.custom_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3,
        )
        content = response.choices[0].message.content
        text = (content or "").strip()
        usage = response.usage
        input_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
        output_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
        elapsed = _time.time() - t0

        logger.info(f"[LLM] Custom (with_usage) response: {len(text)} chars in {elapsed:.1f}s | tokens: {input_tokens + output_tokens}")
        print(f"[LLM_HANDLER] Custom (with_usage) {'SUCCESS' if text else 'EMPTY'}: {len(text)} chars in {elapsed:.1f}s", flush=True)

        return {
            "text": text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "model": model,
        }

    def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate response using the configured LLM with automatic fallback
        Reads current settings dynamically to support runtime configuration changes

        Args:
            prompt: User prompt
            max_tokens: Maximum tokens in response (defaults to settings.MAX_TOKENS)
            system_prompt: Optional system prompt

        Returns:
            str: Generated response
        """
        if max_tokens is None:
            max_tokens = settings.MAX_TOKENS

        # Read current settings dynamically (supports runtime config changes)
        current_provider = (settings.DEFAULT_LLM_PROVIDER or self.llm_provider).lower()
        if current_provider == "claude":
            current_model = settings.CLAUDE_MODEL
        elif current_provider == "custom":
            current_model = settings.CUSTOM_LLM_MODEL
        else:
            current_model = settings.OPENAI_MODEL
        
        # Update provider and model if settings changed
        if current_provider != self.llm_provider or current_model != self.model:
            logger.info(
                f"LLM config changed: {self.llm_provider}/{self.model} -> "
                f"{current_provider}/{current_model}. Updating handler..."
            )
            self.llm_provider = current_provider
            self.model = current_model
            # Reinitialize clients with new settings
            self._initialize_clients()

        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Try primary provider
        try:
            if self.llm_provider == "claude":
                return self._call_claude(messages, max_tokens)
            elif self.llm_provider == "custom":
                return self._call_custom(messages, max_tokens)
            else:
                return self._call_openai(messages, max_tokens)

        except Exception as e:
            logger.warning(f"Primary LLM provider ({self.llm_provider}) failed: {str(e)}")
            logger.info("Attempting fallback to alternate provider...")

            # Try fallback
            try:
                if self.llm_provider == "claude" and self.openai_client:
                    logger.info("Falling back to OpenAI")
                    # Temporarily switch to default OpenAI model
                    original_model = self.model
                    self.model = self.DEFAULT_OPENAI_MODEL
                    result = self._call_openai(messages, max_tokens)
                    self.model = original_model
                    return result

                elif self.llm_provider == "openai" and self.claude_client:
                    logger.info("Falling back to Claude")
                    # Temporarily switch to default Claude model
                    original_model = self.model
                    self.model = self.DEFAULT_CLAUDE_MODEL
                    result = self._call_claude(messages, max_tokens)
                    self.model = original_model
                    return result

                else:
                    raise Exception("No fallback provider available")

            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                raise Exception(
                    f"Both primary and fallback LLM providers failed. "
                    f"Primary: {str(e)}, Fallback: {str(fallback_error)}"
                )


    def generate_with_usage(
        self,
        prompt: str,
        max_tokens: int = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate response and return both text and token usage.
        Returns: {"text": str, "input_tokens": int, "output_tokens": int, "total_tokens": int, "model": str}
        """
        if max_tokens is None:
            max_tokens = settings.MAX_TOKENS

        current_provider = (settings.DEFAULT_LLM_PROVIDER or self.llm_provider).lower()
        if current_provider == "claude":
            current_model = settings.CLAUDE_MODEL
        elif current_provider == "custom":
            current_model = settings.CUSTOM_LLM_MODEL
        else:
            current_model = settings.OPENAI_MODEL

        if current_provider != self.llm_provider or current_model != self.model:
            self.llm_provider = current_provider
            self.model = current_model
            self._initialize_clients()

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Try primary provider with fallback
        try:
            if self.llm_provider == "claude":
                return self._call_claude_with_usage(messages, max_tokens)
            elif self.llm_provider == "custom":
                return self._call_custom_with_usage(messages, max_tokens)
            else:
                return self._call_openai_with_usage(messages, max_tokens)

        except Exception as e:
            logger.warning(f"Primary LLM provider ({self.llm_provider}) failed (with_usage): {str(e)}")
            logger.info("Attempting fallback (with_usage)...")

            try:
                if self.llm_provider == "claude" and self.openai_client:
                    original_model = self.model
                    self.model = self.DEFAULT_OPENAI_MODEL
                    result = self._call_openai_with_usage(messages, max_tokens)
                    self.model = original_model
                    return result
                elif self.llm_provider == "custom" and self.openai_client:
                    original_model = self.model
                    self.model = self.DEFAULT_OPENAI_MODEL
                    result = self._call_openai_with_usage(messages, max_tokens)
                    self.model = original_model
                    return result
                elif self.llm_provider == "openai" and self.claude_client:
                    original_model = self.model
                    self.model = self.DEFAULT_CLAUDE_MODEL
                    result = self._call_claude_with_usage(messages, max_tokens)
                    self.model = original_model
                    return result
                else:
                    raise Exception("No fallback provider available")
            except Exception as fallback_error:
                logger.error(f"Fallback also failed (with_usage): {str(fallback_error)}")
                raise Exception(
                    f"Both primary and fallback LLM providers failed. "
                    f"Primary: {str(e)}, Fallback: {str(fallback_error)}"
                )

    def _call_claude_with_usage(self, messages: list, max_tokens: int) -> Dict[str, Any]:
        if not self.claude_client:
            raise Exception("Claude client not initialized.")

        system_message = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                user_messages.append({"role": msg["role"], "content": msg["content"]})
        if not user_messages:
            user_messages = [{"role": "user", "content": messages[0]["content"]}]

        kwargs = {"model": self.model, "max_tokens": max_tokens, "messages": user_messages}
        if system_message:
            kwargs["system"] = system_message

        response = self.claude_client.messages.create(**kwargs)
        text = response.content[0].text
        input_tokens = getattr(response.usage, 'input_tokens', 0)
        output_tokens = getattr(response.usage, 'output_tokens', 0)

        return {
            "text": text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "model": self.model,
        }

    def _call_openai_with_usage(self, messages: list, max_tokens: int) -> Dict[str, Any]:
        if not self.openai_client:
            raise Exception("OpenAI client not initialized.")

        response = self.openai_client.chat.completions.create(
            model=self.model, messages=messages, max_tokens=max_tokens, temperature=0.3
        )
        text = response.choices[0].message.content
        usage = response.usage
        input_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
        output_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0

        return {
            "text": text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "model": self.model,
        }


# Global instance
llm_handler = LLMHandler()
