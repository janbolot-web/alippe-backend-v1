import { AIPromptService } from "../services/ai-prompt-service.js";

// Initialize default prompts
export const initializePrompts = async (req, res) => {
  try {
    const prompts = await AIPromptService.initializeDefaultPrompts();
    res.status(200).json({
      success: true,
      message: "Default prompts initialized",
      prompts,
    });
  } catch (error) {
    console.error("Error initializing prompts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize prompts",
      error: error.message,
    });
  }
};

// Get all AI prompts
export const getAllPrompts = async (req, res) => {
  try {
    const prompts = await AIPromptService.getAllPrompts();
    res.status(200).json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prompts",
      error: error.message,
    });
  }
};

// Get prompt by ID
export const getPromptById = async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await AIPromptService.getPromptById(id);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }
    
    res.status(200).json(prompt);
  } catch (error) {
    console.error("Error fetching prompt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prompt",
      error: error.message,
    });
  }
};

// Create a new AI prompt
export const createPrompt = async (req, res) => {
  try {
    const promptData = req.body;
    
    // Add lastModifiedBy if user ID is available
    if (req.user && req.user.id) {
      promptData.lastModifiedBy = req.user.id;
    }
    
    const prompt = await AIPromptService.createPrompt(promptData);
    res.status(201).json({
      success: true,
      message: "Prompt created successfully",
      prompt,
    });
  } catch (error) {
    console.error("Error creating prompt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create prompt",
      error: error.message,
    });
  }
};

// Update an existing AI prompt
export const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const promptData = req.body;
    
    // Add lastModifiedBy if user ID is available
    if (req.user && req.user.id) {
      promptData.lastModifiedBy = req.user.id;
    }
    
    const updatedPrompt = await AIPromptService.updatePrompt(id, promptData);
    
    if (!updatedPrompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Prompt updated successfully",
      prompt: updatedPrompt,
    });
  } catch (error) {
    console.error("Error updating prompt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prompt",
      error: error.message,
    });
  }
};

// Delete an AI prompt
export const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPrompt = await AIPromptService.deletePrompt(id);
    
    if (!deletedPrompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Prompt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete prompt",
      error: error.message,
    });
  }
};

// Get prompts by genre and language
export const getPromptsByGenreAndLanguage = async (req, res) => {
  try {
    const { genre, language } = req.params;
    const prompts = await AIPromptService.getPromptsByGenreAndLanguage(genre, language);
    res.status(200).json(prompts);
  } catch (error) {
    console.error("Error fetching prompts by genre and language:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prompts by genre and language",
      error: error.message,
    });
  }
};

// Принудительное обновление всех промптов
export const forceUpdatePrompts = async (req, res) => {
  try {
    const prompts = await AIPromptService.forceUpdatePrompts();
    res.status(200).json({
      success: true,
      message: "All prompts have been updated",
      count: prompts.length,
      prompts,
    });
  } catch (error) {
    console.error("Error updating prompts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prompts",
      error: error.message,
    });
  }
}; 