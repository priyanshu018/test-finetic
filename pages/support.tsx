import React, { useState } from 'react'
import { Send, Clock, CheckCircle, AlertCircle, User, Calendar, Hash } from 'lucide-react'

export default function Support() {
    const [tickets, setTickets] = useState([])
    const [currentTicket, setCurrentTicket] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general'
    })
    const [showForm, setShowForm] = useState(true)

    const generateTicketId = () => {
        return 'TKT-' + Date.now().toString().slice(-6)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const newTicket = {
            id: generateTicketId(),
            ...formData,
            status: 'open',
            createdAt: new Date().toISOString(),
            responses: [
                {
                    id: 1,
                    message: `Thank you for contacting support regarding "${formData.title}". We have received your ticket and our team will review it shortly. We aim to respond within 24 hours for ${formData.priority} priority issues.`,
                    sender: 'Support Team',
                    timestamp: new Date().toISOString(),
                    isSupport: true
                }
            ]
        }

        setTickets([newTicket, ...tickets])
        setCurrentTicket(newTicket)
        setFormData({ title: '', description: '', priority: 'medium', category: 'general' })
        setShowForm(false)

        // Simulate support response after 3 seconds
        setTimeout(() => {
            const response = generateSupportResponse(newTicket)
            setTickets(prev => prev.map(ticket =>
                ticket.id === newTicket.id
                    ? { ...ticket, responses: [...ticket.responses, response], status: 'in-progress' }
                    : ticket
            ))
            setCurrentTicket(prev => ({
                ...prev,
                responses: [...prev.responses, response],
                status: 'in-progress'
            }))
        }, 3000)
    }

    const generateSupportResponse = (ticket) => {
        const responses = {
            technical: `I've reviewed your technical issue regarding "${ticket.title}". This appears to be related to ${ticket.category} functionality. I'm escalating this to our development team for further investigation. In the meantime, please try clearing your browser cache and cookies. I'll update you within 2-4 hours with more information.`,
            billing: `Thank you for reaching out about your billing inquiry. I've located your account and am reviewing the details of "${ticket.title}". Our billing specialist will investigate this matter and provide a resolution within 1-2 business days. If this is urgent, please reply with your account number for faster processing.`,
            general: `I've received your inquiry about "${ticket.title}". Based on your description, I understand you're experiencing issues with ${ticket.category}. I'm working on finding a solution for you. Please allow 12-24 hours for a detailed response with next steps.`,
            account: `I've reviewed your account-related request regarding "${ticket.title}". For security purposes, I'll need to verify some information before proceeding. Our account specialist will contact you within 4-6 hours to assist with this matter.`
        }

        return {
            id: Date.now(),
            message: responses[ticket.category] || responses.general,
            sender: 'Alex Johnson - Support Specialist',
            timestamp: new Date(Date.now() + 3000).toISOString(),
            isSupport: true
        }
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50'
            case 'medium': return 'text-yellow-600 bg-yellow-50'
            case 'low': return 'text-green-600 bg-green-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-50'
            case 'in-progress': return 'text-yellow-600 bg-yellow-50'
            case 'resolved': return 'text-green-600 bg-green-50'
            case 'closed': return 'text-gray-600 bg-gray-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    if (currentTicket && !showForm) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">Support Ticket</h1>
                                    <p className="text-blue-100 mt-1">Your issue is being tracked</p>
                                </div>
                                <button
                                    onClick={() => { setShowForm(true); setCurrentTicket(null) }}
                                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                                >
                                    New Ticket
                                </button>
                            </div>
                        </div>

                        {/* Ticket Info */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold text-gray-700">ID:</span>
                                    <span className="text-gray-900">{currentTicket.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTicket.status)}`}>
                                        {currentTicket.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentTicket.priority)}`}>
                                        {currentTicket.priority.toUpperCase()} PRIORITY
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{formatDate(currentTicket.createdAt)}</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentTicket.title}</h2>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{currentTicket.description}</p>
                            </div>
                        </div>

                        {/* Responses */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
                            <div className="space-y-4">
                                {currentTicket.responses.map((response) => (
                                    <div key={response.id} className={`flex gap-3 ${response.isSupport ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-3xl ${response.isSupport ? 'order-2' : 'order-1'}`}>
                                            <div className={`p-4 rounded-lg ${response.isSupport
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'bg-gray-100 border border-gray-200'
                                                }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`font-medium text-sm ${response.isSupport ? 'text-blue-800' : 'text-gray-800'
                                                        }`}>
                                                        {response.sender}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(response.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700">{response.message}</p>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${response.isSupport
                                                ? 'bg-blue-100 order-1'
                                                : 'bg-gray-200 order-2'
                                            }`}>
                                            {response.isSupport ? (
                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <User className="w-4 h-4 text-gray-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Status indicator */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="text-blue-800 font-medium">
                                        Our support team is working on your request
                                    </span>
                                </div>
                                <p className="text-blue-700 mt-1 text-sm">
                                    You'll receive email notifications when there are updates to your ticket.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                        <h1 className="text-2xl font-bold">Support Center</h1>
                        <p className="text-blue-100 mt-1">Submit a ticket and get help from our support team</p>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Brief description of your issue"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="general">General Support</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="billing">Billing & Payment</option>
                                    <option value="account">Account Management</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={5}
                                placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-gray-600">
                                    <p className="font-medium text-gray-700 mb-1">Before submitting:</p>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• Check our FAQ section for common solutions</li>
                                        <li>• Include relevant error messages or screenshots</li>
                                        <li>• Provide steps to reproduce the issue</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Submit Support Ticket
                        </button>
                    </div>
                </div>

                {/* Recent Tickets */}
                {tickets.length > 0 && (
                    <div className="border-t border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Tickets</h3>
                        <div className="space-y-3">
                            {tickets.slice(0, 3).map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => { setCurrentTicket(ticket); setShowForm(false) }}
                                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{ticket.id}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-700 mt-1 truncate">{ticket.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
  )
}