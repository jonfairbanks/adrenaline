import { Component } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FaRegFileAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import PaywallMessage from "./PaywallMessage";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.onToggleContext = this.onToggleContext.bind(this);
        this.onToggleLearnMore = this.onToggleLearnMore.bind(this);

        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.renderReasoningSteps = this.renderReasoningSteps.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderOptions = this.renderOptions.bind(this);
        this.renderContext = this.renderContext.bind(this);
        this.renderScrollAnchor = this.renderScrollAnchor.bind(this);

        this.state = {
            renderContext: false,
            renderLearnMore: false
        };
    }

    /* Event Handlers */

    onToggleContext() {
        const { isLastMessage } = this.props;
        const { renderContext } = this.state;

        this.setState({ renderContext: !renderContext, renderLearnMore: false });

        if (!renderContext && isLastMessage) {
            this.scrollToBottom();
        }
    }

    onToggleLearnMore() {
        const { renderLearnMore, isLastMessage } = this.state;

        this.setState({ renderLearnMore: !renderLearnMore, renderContext: false });

        if (!renderLearnMore && isLastMessage) {
            this.scrollToBottom();
        }
    }

    /* Utilities */

    scrollToBottom() {
        const { isLastMessage } = this.props;

        if (isLastMessage) {
            this.endOfMessage.scrollIntoView({ behavior: "smooth" });
        }
    }

    isLoading() {
        const { isResponse, children, isComplete } = this.props;
        return isResponse && children == "" && !isComplete;
    }

    renderOptions() {
        const { isFirstMessage, isResponse, isComplete } = this.props;
        const { renderContext, renderLearnMore } = this.state;

        if (!isResponse || this.isLoading() || isFirstMessage || !isComplete) {
            return;
        }

        return (
            <div className="responseOptions">
                <div
                    className={`optionButton ${renderContext ? "isClicked" : ""}`}
                    onClick={this.onToggleContext}
                >
                    Context
                </div>
                <div
                    className={`optionButton ${renderLearnMore ? "isClicked" : ""}`}
                    onClick={this.onToggleLearnMore}
                >
                    Learn more
                </div>
            </div>
        );
    }

    renderMessage() {
        const { children } = this.props;

        const messageContent = children.split("```").map((text, index) => {
            // TODO: Remove trailing newlines

            if (index % 2) { // Code block
                let codeLines = text.split('\n');
                let programmingLanguage = 'text';

                if (codeLines[0].match(/^[a-zA-Z]+$/)) {
                    programmingLanguage = codeLines.shift();
                }
                codeLines = codeLines.join('\n');

                return (
                    <SyntaxHighlighter
                        className="codeBlock"
                        language={programmingLanguage}
                        style={dracula}
                        showLineNumbers={true}
                    >
                        {codeLines.trim()}
                    </SyntaxHighlighter>
                );
            }

            return (
                <pre className={"plainText"}>{
                    text.split("`").map((otherText, otherIndex) => {
                        if (otherIndex % 2) { // In-line code
                            return (<b>{`\`${otherText}\``}</b>);
                        }

                        return otherText.replace(/^\n/, "")
                    })
                }</pre>
            );
        });
        return (<div className="messageContent">{messageContent}</div>);
    }

    renderPaywall() {
        const { isPaywalled, isComplete, onUpgradePlan } = this.props;

        if (isPaywalled && isComplete) {
            return (
                <PaywallMessage onUpgradePlan={onUpgradePlan} />
            );
        }
    }

    renderReasoningSteps() {
        const { steps } = this.props;

        return Object.keys(steps).map(stepType => (
            <div className="reasoningStep">
                <span className="stepType">{stepType}:</span> <span className="stepContent">{steps[stepType]}</span>
            </div>
        ));
    }

    renderContext() {
        const { renderContext } = this.state;
        const { sources, setFileContext } = this.props;

        if (!renderContext) {
            return null;
        }

        const filePaths = sources.map(source => {
            const { filePath } = source;

            return (
                <span className="contextSource" onClick={() => setFileContext(filePath)}>
                    <FaRegFileAlt fill="white" size={16} /> {filePath}
                </span>
            )
        });

        return (
            <motion.div
                initial={{ translateY: -50, opacity: 0.0 }}
                animate={{ translateY: 0, opacity: 1.0 }}
                exit={{ translateY: -50, opacity: 0.0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="optionsDisplay"
            >
                {filePaths}
            </motion.div>
        );
    }

    renderScrollAnchor() {
        const { isLastMessage } = this.props;

        if (isLastMessage) {
            return (
                <div style={{ float: "left", clear: "both" }}
                    ref={(el) => { this.endOfMessage = el; }}>
                </div>
            );
        }
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        const { isResponse, isPaywalled } = this.props;
        const isLoading = this.isLoading();

        return (
            <>

                <div className="chatMessageContainer">
                    {this.renderReasoningSteps()}
                    <div
                        className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""} ${isLoading ? "loadingMessage" : ""}`}>
                        {this.renderPaywall()}
                        <div className={`messageContainer ${isPaywalled ? "blocked" : ""}`}>
                            {this.renderMessage()}
                        </div>
                        {this.renderOptions()}
                    </div>
                    <AnimatePresence>{this.renderContext()}</AnimatePresence>
                </div>

                {this.renderScrollAnchor()}
            </>
        );
    }
}
