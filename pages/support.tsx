import React, { useState } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2, User, Bot, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

export default function FloatingSupportWidget({ user }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [currentStep, setCurrentStep] = useState('chat') // 'chat', 'form'
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: `Hi ${user?.user_metadata?.full_name || user?.email || 'there'}! I'm here to help you. What can I assist you with today?`,
            sender: 'support',
            timestamp: new Date().toISOString()
        }
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [ticketForm, setTicketForm] = useState({
        title: '',
        category: 'general',
        priority: 'medium',
        description: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return

        const newMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, newMessage])
        setInputMessage('')

        // Simulate support response
        setTimeout(() => {
            const responses = [
                "I understand your concern. Let me help you create a support ticket for this issue.",
                "Thank you for reaching out. I'd be happy to assist you with that.",
                "I see what you're experiencing. Let's get this resolved for you quickly.",
                "That's a great question! Let me connect you with the right support specialist.",
                "I can help you with that. Let me gather some more information to assist you better."
            ]
            
            const supportResponse = {
                id: Date.now() + 1,
                text: responses[Math.floor(Math.random() * responses.length)],
                sender: 'support',
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, supportResponse])

            // Show notification if chat is minimized or closed
            if (isMinimized || !isOpen) {
                setHasUnreadMessages(true)
                toast.info('New support message received!', {
                    onClick: () => {
                        setIsOpen(true)
                        setIsMinimized(false)
                        setHasUnreadMessages(false)
                    }
                })
            }

            // After support response, offer to create ticket
            setTimeout(() => {
                const ticketOffer = {
                    id: Date.now() + 2,
                    text: "Would you like me to create a support ticket for you? This will ensure your issue gets proper attention from our specialized team.",
                    sender: 'support',
                    timestamp: new Date().toISOString(),
                    hasAction: true
                }
                setMessages(prev => [...prev, ticketOffer])
            }, 1500)
        }, 1000)
    }

    const handleCreateTicket = () => {
        setCurrentStep('form')
        // Pre-populate form with conversation context
        const conversationContext = messages
            .filter(m => m.sender === 'user')
            .map(m => m.text)
            .join('. ')
        
        setTicketForm(prev => ({
            ...prev,
            description: conversationContext || prev.description
        }))
    }

    const handleFormSubmit = async () => {
        if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
            toast.error('Please fill in all required fields')
            return
        }
        
        setIsSubmitting(true)

        try {
            // Here you would integrate with your Supabase database
            // Example of what the ticket data would look like:
            const ticketData = {
                user_id: user.id,
                user_email: user.email,
                user_name: user.user_metadata?.full_name || user.email,
                title: ticketForm.title,
                description: ticketForm.description,
                category: ticketForm.category,
                priority: ticketForm.priority,
                status: 'open',
                created_at: new Date().toISOString(),
                conversation_history: messages
            }

            // Simulate API call - replace with actual Supabase call
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const ticketId = 'TKT-' + Date.now().toString().slice(-6)
            
            const confirmationMessage = {
                id: Date.now(),
                text: `Perfect! I've created ticket ${ticketId} for you. Our team will review your "${ticketForm.title}" issue and get back to you within 24 hours. You'll receive email updates at ${user.email} regarding your ticket progress.`,
                sender: 'support',
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, confirmationMessage])
            setCurrentStep('chat')
            setTicketForm({ title: '', category: 'general', priority: 'medium', description: '' })
            
            toast.success(`Support ticket ${ticketId} created successfully!`)
            
        } catch (error) {
            console.error('Error creating ticket:', error)
            toast.error('Failed to create ticket. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenChat = () => {
        setIsOpen(true)
        setHasUnreadMessages(false)
    }

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200'
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'low': return 'text-green-600 bg-green-50 border-green-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    // Floating icon
    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={handleOpenChat}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
                {/* Notification dot */}
                {hasUnreadMessages && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                )}
            </div>
        )
    }

    // Chat interface
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
                isMinimized ? 'w-80 h-16' : 'w-80 h-96'
            }`}>
                {/* Header */}
                <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="font-medium text-sm">Support Chat</span>
                        <span className="text-xs opacity-75">• Online</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title={isMinimized ? 'Expand' : 'Minimize'}
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {currentStep === 'chat' ? (
                            <>
                                {/* Messages */}
                                <div className="flex-1 p-3 space-y-3 h-64 overflow-y-auto">
                                    {messages.map((message) => (
                                        <div key={message.id} className="flex flex-col">
                                            <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                                    message.sender === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                }`}>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {message.sender === 'support' ? (
                                                            <Bot className="w-3 h-3" />
                                                        ) : (
                                                            <User className="w-3 h-3" />
                                                        )}
                                                        <span className="text-xs opacity-75">
                                                            {message.sender === 'support' ? 'Support' : 'You'}
                                                        </span>
                                                    </div>
                                                    <p>{message.text}</p>
                                                </div>
                                            </div>
                                            <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-xs text-gray-500 mt-1 mx-3">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                            </div>
                                            {message.hasAction && (
                                                <div className="flex justify-start mt-2">
                                                    <button
                                                        onClick={handleCreateTicket}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-full transition-colors"
                                                    >
                                                        Create Ticket
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-gray-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputMessage.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Ticket Form */
                            <div className="p-3 space-y-3 h-80 overflow-y-auto">
                                {/* User Info Display */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <User className="w-3 h-3" />
                                        <span className="font-medium">
                                            {user.user_metadata?.full_name || user.email}
                                        </span>
                                    </div>
                                    <div className="text-blue-600 text-xs mt-1">{user.email}</div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Issue Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={ticketForm.title}
                                        onChange={(e) => setTicketForm(prev => ({...prev, title: e.target.value}))}
                                        placeholder="Brief description of your issue"
                                        className="w-full px-2 py-1 border border-gray-300 text-black rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={ticketForm.category}
                                            onChange={(e) => setTicketForm(prev => ({...prev, category: e.target.value}))}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="general">General Support</option>
                                            <option value="technical">Technical Issue</option>
                                            <option value="billing">Billing & Payment</option>
                                            <option value="account">Account Management</option>
                                            <option value="tally">Tally Integration</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Priority
                                        </label>
                                        <select
                                            value={ticketForm.priority}
                                            onChange={(e) => setTicketForm(prev => ({...prev, priority: e.target.value}))}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Priority helper */}
                                <div className={`px-2 py-1 rounded text-xs border ${getPriorityColor(ticketForm.priority)}`}>
                                    <div className="flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span className="font-medium">
                                            {ticketForm.priority === 'high' && 'High Priority - Response within 4 hours'}
                                            {ticketForm.priority === 'medium' && 'Medium Priority - Response within 24 hours'}
                                            {ticketForm.priority === 'low' && 'Low Priority - Response within 48 hours'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Detailed Description *
                                    </label>
                                    <textarea
                                        value={ticketForm.description}
                                        onChange={(e) => setTicketForm(prev => ({...prev, description: e.target.value}))}
                                        placeholder="Please provide detailed information about your issue..."
                                        rows={4}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setCurrentStep('chat')}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-3 rounded text-sm transition-colors"
                                    >
                                        Back to Chat
                                    </button>
                                    <button
                                        onClick={handleFormSubmit}
                                        disabled={isSubmitting || !ticketForm.title.trim() || !ticketForm.description.trim()}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-3 h-3" />
                                                Submit Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}