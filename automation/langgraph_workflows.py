"""
LangGraph Workflow Definitions
Intelligent orchestration for document processing workflows
"""

from typing import Dict, Any, List, Optional, TypedDict
from datetime import datetime
import logging

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger(__name__)

class DocumentProcessingState(TypedDict):
    """State for document processing workflow"""
    # Input data
    source_commits: List[Dict[str, Any]]
    source_repo: str
    trigger_data: Dict[str, Any]
    
    # Processing state
    current_step: str
    processed_commits: List[Dict[str, Any]]
    documentation_updates: List[Dict[str, Any]]
    rag_updates: List[Dict[str, Any]]
    
    # Status and metadata
    status: str
    errors: List[str]
    messages: List[BaseMessage]
    start_time: str
    end_time: Optional[str]
    
    # Results
    documents_created: int
    documents_updated: int
    rag_entries_added: int

class LangGraphWorkflows:
    """
    LangGraph workflow definitions for intelligent document processing
    Provides stateful, multi-step processing with decision-making capabilities
    """
    
    def __init__(self, openai_api_key: str = None):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            api_key=openai_api_key
        ) if openai_api_key else None
        
        self.memory = MemorySaver()
        
    def create_document_processing_workflow(self) -> StateGraph:
        """Create the main document processing workflow graph"""
        
        workflow = StateGraph(DocumentProcessingState)
        
        # Add nodes
        workflow.add_node("initialize", self._initialize_processing)
        workflow.add_node("analyze_commits", self._analyze_commits)
        workflow.add_node("generate_documentation", self._generate_documentation)
        workflow.add_node("update_rag_system", self._update_rag_system)
        workflow.add_node("validate_results", self._validate_results)
        workflow.add_node("handle_errors", self._handle_errors)
        workflow.add_node("finalize", self._finalize_processing)
        
        # Define edges
        workflow.set_entry_point("initialize")
        
        workflow.add_edge("initialize", "analyze_commits")
        workflow.add_conditional_edges(
            "analyze_commits",
            self._should_continue_after_analysis,
            {
                "continue": "generate_documentation",
                "error": "handle_errors"
            }
        )
        
        workflow.add_conditional_edges(
            "generate_documentation", 
            self._should_update_rag,
            {
                "update_rag": "update_rag_system",
                "validate": "validate_results",
                "error": "handle_errors"
            }
        )
        
        workflow.add_conditional_edges(
            "update_rag_system",
            self._should_validate,
            {
                "validate": "validate_results",
                "error": "handle_errors"
            }
        )
        
        workflow.add_conditional_edges(
            "validate_results",
            self._should_finalize,
            {
                "finalize": "finalize",
                "retry": "analyze_commits",
                "error": "handle_errors"
            }
        )
        
        workflow.add_edge("handle_errors", "finalize")
        workflow.add_edge("finalize", END)
        
        return workflow.compile(checkpointer=self.memory)
    
    def _initialize_processing(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Initialize the document processing workflow"""
        try:
            logger.info("🎯 Initializing document processing workflow")
            
            state["current_step"] = "initialize"
            state["status"] = "initializing"
            state["start_time"] = datetime.utcnow().isoformat()
            state["processed_commits"] = []
            state["documentation_updates"] = []
            state["rag_updates"] = []
            state["errors"] = []
            state["documents_created"] = 0
            state["documents_updated"] = 0
            state["rag_entries_added"] = 0
            
            if not state.get("messages"):
                state["messages"] = []
            
            # Add initialization message
            init_message = HumanMessage(content=f"""
            Starting document processing for {len(state.get('source_commits', []))} commits 
            from repository: {state.get('source_repo', 'Unknown')}
            """)
            state["messages"].append(init_message)
            
            state["status"] = "initialized"
            logger.info("✅ Document processing workflow initialized")
            
        except Exception as e:
            logger.error(f"❌ Initialization error: {e}")
            state["status"] = "error"
            state["errors"].append(f"Initialization failed: {e}")
        
        return state
    
    def _analyze_commits(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Analyze commits using LLM intelligence"""
        try:
            logger.info("🔍 Analyzing commits with LLM intelligence")
            
            state["current_step"] = "analyze_commits"
            state["status"] = "analyzing"
            
            commits = state.get("source_commits", [])
            
            if not commits:
                state["status"] = "error"
                state["errors"].append("No commits to analyze")
                return state
            
            # Use LLM to analyze commits if available
            if self.llm:
                analysis_prompt = self._create_commit_analysis_prompt(commits)
                
                try:
                    response = self.llm.invoke([HumanMessage(content=analysis_prompt)])
                    analysis_message = AIMessage(content=response.content)
                    state["messages"].append(analysis_message)
                    
                    logger.info("🤖 LLM commit analysis completed")
                except Exception as e:
                    logger.warning(f"⚠️ LLM analysis failed, using fallback: {e}")
            
            # Process each commit
            for commit in commits:
                processed_commit = self._process_single_commit(commit, state)
                if processed_commit:
                    state["processed_commits"].append(processed_commit)
            
            state["status"] = "analyzed" 
            logger.info(f"✅ Analyzed {len(state['processed_commits'])} commits")
            
        except Exception as e:
            logger.error(f"❌ Commit analysis error: {e}")
            state["status"] = "error"
            state["errors"].append(f"Commit analysis failed: {e}")
        
        return state
    
    def _generate_documentation(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Generate documentation using intelligent processing"""
        try:
            logger.info("📝 Generating intelligent documentation")
            
            state["current_step"] = "generate_documentation"
            state["status"] = "generating_docs"
            
            processed_commits = state.get("processed_commits", [])
            
            for commit_data in processed_commits:
                doc_content = self._generate_commit_documentation(commit_data, state)
                
                if doc_content:
                    doc_update = {
                        "commit_hash": commit_data.get("commit_hash"),
                        "title": f"Commit {commit_data.get('commit_hash')}: {commit_data.get('message')}",
                        "content": doc_content,
                        "files_changed": commit_data.get("files_changed", []),
                        "timestamp": datetime.utcnow().isoformat(),
                        "source_repo": state.get("source_repo"),
                        "impact_analysis": commit_data.get("impact_analysis"),
                        "component_classification": commit_data.get("component_classification")
                    }
                    
                    state["documentation_updates"].append(doc_update)
                    state["documents_created"] += 1
            
            state["status"] = "docs_generated"
            logger.info(f"✅ Generated {len(state['documentation_updates'])} documentation updates")
            
        except Exception as e:
            logger.error(f"❌ Documentation generation error: {e}")
            state["status"] = "error"
            state["errors"].append(f"Documentation generation failed: {e}")
        
        return state
    
    def _update_rag_system(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Update RAG system with new documentation"""
        try:
            logger.info("🔄 Updating RAG system")
            
            state["current_step"] = "update_rag_system" 
            state["status"] = "updating_rag"
            
            documentation_updates = state.get("documentation_updates", [])
            
            for doc_update in documentation_updates:
                rag_entry = {
                    "type": "source_commit_update",
                    "commit_hash": doc_update.get("commit_hash"),
                    "title": doc_update.get("title"),
                    "content": doc_update.get("content"),
                    "files_changed": doc_update.get("files_changed", []),
                    "source_repo": doc_update.get("source_repo"),
                    "timestamp": doc_update.get("timestamp"),
                    "impact_analysis": doc_update.get("impact_analysis"),
                    "component_classification": doc_update.get("component_classification"),
                    "processed_date": datetime.utcnow().isoformat()
                }
                
                state["rag_updates"].append(rag_entry)
                state["rag_entries_added"] += 1
            
            state["status"] = "rag_updated"
            logger.info(f"✅ Prepared {len(state['rag_updates'])} RAG updates")
            
        except Exception as e:
            logger.error(f"❌ RAG update error: {e}")
            state["status"] = "error"
            state["errors"].append(f"RAG update failed: {e}")
        
        return state
    
    def _validate_results(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Validate processing results"""
        try:
            logger.info("✅ Validating processing results")
            
            state["current_step"] = "validate_results"
            state["status"] = "validating"
            
            # Validation checks
            validation_errors = []
            
            # Check if we have commits to process
            if not state.get("source_commits"):
                validation_errors.append("No source commits provided")
            
            # Check if documentation was generated
            if not state.get("documentation_updates"):
                validation_errors.append("No documentation updates generated")
            
            # Check if RAG updates were prepared
            if not state.get("rag_updates"):
                validation_errors.append("No RAG updates prepared")
            
            # Check consistency
            expected_docs = len(state.get("source_commits", []))
            actual_docs = len(state.get("documentation_updates", []))
            
            if expected_docs != actual_docs:
                validation_errors.append(f"Documentation mismatch: expected {expected_docs}, got {actual_docs}")
            
            if validation_errors:
                state["status"] = "validation_failed"
                state["errors"].extend(validation_errors)
                logger.warning(f"⚠️ Validation failed: {validation_errors}")
            else:
                state["status"] = "validated"
                logger.info("✅ Validation passed successfully")
            
        except Exception as e:
            logger.error(f"❌ Validation error: {e}")
            state["status"] = "error"
            state["errors"].append(f"Validation failed: {e}")
        
        return state
    
    def _handle_errors(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Handle errors with intelligent recovery"""
        try:
            logger.info("🔧 Handling errors with intelligent recovery")
            
            state["current_step"] = "handle_errors"
            errors = state.get("errors", [])
            
            if errors:
                error_summary = "; ".join(errors)
                logger.error(f"❌ Processing errors: {error_summary}")
                
                # Use LLM for error analysis if available
                if self.llm:
                    try:
                        error_analysis_prompt = f"""
                        Analyze these document processing errors and suggest recovery strategies:
                        
                        Errors: {error_summary}
                        
                        Current state: {state.get('current_step', 'unknown')}
                        Commits processed: {len(state.get('processed_commits', []))}
                        Docs generated: {len(state.get('documentation_updates', []))}
                        
                        Suggest specific recovery actions.
                        """
                        
                        response = self.llm.invoke([HumanMessage(content=error_analysis_prompt)])
                        error_analysis = AIMessage(content=response.content)
                        state["messages"].append(error_analysis)
                        
                        logger.info("🤖 LLM error analysis completed")
                    except Exception as e:
                        logger.warning(f"⚠️ LLM error analysis failed: {e}")
            
            state["status"] = "error_handled"
            
        except Exception as e:
            logger.error(f"❌ Error handling failed: {e}")
            state["status"] = "fatal_error"
            state["errors"].append(f"Error handling failed: {e}")
        
        return state
    
    def _finalize_processing(self, state: DocumentProcessingState) -> DocumentProcessingState:
        """Finalize the processing workflow"""
        try:
            logger.info("🎯 Finalizing document processing workflow")
            
            state["current_step"] = "finalize"
            state["end_time"] = datetime.utcnow().isoformat()
            
            # Determine final status
            if state.get("errors"):
                state["status"] = "completed_with_errors"
            else:
                state["status"] = "completed_successfully"
            
            # Create summary message
            summary = f"""
            Document Processing Complete:
            - Commits processed: {len(state.get('processed_commits', []))}
            - Documents created: {state.get('documents_created', 0)}
            - RAG entries added: {state.get('rag_entries_added', 0)}
            - Status: {state.get('status')}
            - Errors: {len(state.get('errors', []))}
            """
            
            summary_message = AIMessage(content=summary)
            state["messages"].append(summary_message)
            
            logger.info(f"✅ Processing finalized: {state.get('status')}")
            
        except Exception as e:
            logger.error(f"❌ Finalization error: {e}")
            state["status"] = "finalization_failed"
            state["errors"].append(f"Finalization failed: {e}")
        
        return state
    
    def _should_continue_after_analysis(self, state: DocumentProcessingState) -> str:
        """Decide whether to continue after commit analysis"""
        if state.get("status") == "error":
            return "error"
        return "continue"
    
    def _should_update_rag(self, state: DocumentProcessingState) -> str:
        """Decide whether to update RAG system"""
        if state.get("status") == "error":
            return "error"
        if state.get("documentation_updates"):
            return "update_rag"
        return "validate"
    
    def _should_validate(self, state: DocumentProcessingState) -> str:
        """Decide whether to validate results"""
        if state.get("status") == "error":
            return "error"
        return "validate"
    
    def _should_finalize(self, state: DocumentProcessingState) -> str:
        """Decide whether to finalize or retry"""
        if state.get("status") == "validation_failed":
            # Could implement retry logic here
            return "error"
        return "finalize"
    
    def _create_commit_analysis_prompt(self, commits: List[Dict]) -> str:
        """Create prompt for LLM commit analysis"""
        commit_summaries = []
        
        for commit in commits:
            commit_summary = f"""
            Commit: {commit.get('commit_hash', 'unknown')}
            Message: {commit.get('message', 'No message')}
            Files: {', '.join(commit.get('files_changed', []))}
            Impact: {commit.get('impact', 'No impact description')}
            """
            commit_summaries.append(commit_summary)
        
        return f"""
        Analyze these software commits for documentation impact:
        
        {chr(10).join(commit_summaries)}
        
        For each commit, identify:
        1. Component classification (UI, Backend, Features, etc.)
        2. Impact on user experience
        3. Documentation priority (High/Medium/Low)
        4. Relationships between commits
        
        Provide a structured analysis focusing on documentation needs.
        """
    
    def _process_single_commit(self, commit: Dict, state: DocumentProcessingState) -> Dict:
        """Process a single commit with enhanced metadata"""
        try:
            commit_hash = commit.get("commit_hash", "")
            message = commit.get("message", "")
            files_changed = commit.get("files_changed", [])
            impact = commit.get("impact", "")
            
            # Classify components based on file paths
            component_types = set()
            for file_path in files_changed:
                if "components/pages/" in file_path:
                    component_types.add("Page Components")
                elif "components/boost/" in file_path:
                    component_types.add("Boost Features")
                elif "components/ui/" in file_path:
                    component_types.add("UI Components")
                elif "pages/" in file_path:
                    component_types.add("Application Pages")
                else:
                    component_types.add("Core Application")
            
            # Enhanced commit data
            processed_commit = {
                "commit_hash": commit_hash,
                "message": message,
                "files_changed": files_changed,
                "impact": impact,
                "component_classification": list(component_types),
                "impact_analysis": {
                    "user_facing": any("components/" in f for f in files_changed),
                    "backend_changes": any("api/" in f or "backend/" in f for f in files_changed),
                    "ui_changes": any("ui/" in f for f in files_changed),
                    "feature_changes": any("boost/" in f or "pages/" in f for f in files_changed)
                },
                "processing_timestamp": datetime.utcnow().isoformat()
            }
            
            return processed_commit
            
        except Exception as e:
            logger.error(f"❌ Error processing commit {commit.get('commit_hash', 'unknown')}: {e}")
            return None
    
    def _generate_commit_documentation(self, commit_data: Dict, state: DocumentProcessingState) -> str:
        """Generate enhanced documentation for a commit"""
        try:
            commit_hash = commit_data.get("commit_hash", "")
            message = commit_data.get("message", "")
            files_changed = commit_data.get("files_changed", [])
            impact = commit_data.get("impact", "")
            components = commit_data.get("component_classification", [])
            
            doc_lines = [
                f"## Commit {commit_hash}",
                f"",
                f"**Message:** {message}",
                f"**Impact:** {impact}",
                f"**Components:** {', '.join(components)}",
                f"**Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                f"",
                f"### Files Modified",
                ""
            ]
            
            for file_path in files_changed:
                doc_lines.append(f"- `{file_path}`")
            
            doc_lines.extend([
                "",
                f"### Impact Analysis",
                f"This commit affects the following areas:",
                ""
            ])
            
            # Add component-specific analysis
            for component in components:
                doc_lines.append(f"- **{component}**: Enhanced functionality and user experience")
            
            doc_lines.extend([
                "",
                f"### Technical Details",
                f"- Repository: {state.get('source_repo', 'Unknown')}",
                f"- Processing Date: {datetime.utcnow().isoformat()}",
                f"- File Count: {len(files_changed)}",
                ""
            ])
            
            return '\n'.join(doc_lines)
            
        except Exception as e:
            logger.error(f"❌ Error generating documentation: {e}")
            return ""