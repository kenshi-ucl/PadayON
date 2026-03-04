import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    PaperAirplaneIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    CheckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TeamMember } from '@/types';

interface SendToTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const notificationTypes = [
    { value: 'announcement', label: 'Announcement', icon: MegaphoneIcon, color: 'indigo' },
    { value: 'alert', label: 'Alert', icon: ExclamationTriangleIcon, color: 'red' },
    { value: 'task', label: 'Task', icon: ClipboardDocumentCheckIcon, color: 'blue' },
] as const;

export default function SendToTeamModal({ isOpen, onClose }: SendToTeamModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [notificationType, setNotificationType] = useState<string>('announcement');
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchTeamMembers();
        }
    }, [isOpen]);

    const fetchTeamMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const response = await axios.get('/notifications/team-members');
            setMembers(response.data.members);
        } catch {
            toast.error('Failed to load team members');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const toggleMember = (id: number) => {
        setSelectedMembers((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map((m) => m.id));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (title.length > 255) newErrors.title = 'Title must not exceed 255 characters';
        if (!body.trim()) newErrors.body = 'Message is required';
        if (body.length > 2000) newErrors.body = 'Message must not exceed 2000 characters';
        if (selectedMembers.length === 0) newErrors.recipients = 'Select at least one recipient';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSending(true);
        try {
            const response = await axios.post('/notifications/send-to-team', {
                title: title.trim(),
                body: body.trim(),
                notification_type: notificationType,
                recipient_ids: selectedMembers,
            });

            toast.success(response.data.message || 'Notification sent successfully!');
            resetForm();
            onClose();
        } catch (error: any) {
            const message =
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to send notification';
            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setBody('');
        setNotificationType('announcement');
        setSelectedMembers([]);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                                            <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-base font-semibold text-gray-900">
                                                Send to Team
                                            </Dialog.Title>
                                            <p className="text-xs text-gray-500">
                                                Notify your team members
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                                    {/* Notification Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type
                                        </label>
                                        <div className="flex gap-2">
                                            {notificationTypes.map((type) => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setNotificationType(type.value)}
                                                    className={clsx(
                                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-all',
                                                        notificationType === type.value
                                                            ? type.color === 'indigo'
                                                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                                : type.color === 'red'
                                                                    ? 'border-red-300 bg-red-50 text-red-700'
                                                                    : 'border-blue-300 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                    )}
                                                >
                                                    <type.icon className="h-4 w-4" />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className={clsx(
                                                'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                                errors.title ? 'border-red-300' : 'border-gray-300'
                                            )}
                                            placeholder="Enter notification title..."
                                            maxLength={255}
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            rows={3}
                                            className={clsx(
                                                'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none',
                                                errors.body ? 'border-red-300' : 'border-gray-300'
                                            )}
                                            placeholder="Write your message..."
                                            maxLength={2000}
                                        />
                                        <div className="flex justify-between mt-1">
                                            {errors.body && (
                                                <p className="text-xs text-red-500">{errors.body}</p>
                                            )}
                                            <span className="text-xs text-gray-400 ml-auto">
                                                {body.length}/2000
                                            </span>
                                        </div>
                                    </div>

                                    {/* Recipients */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Recipients
                                            </label>
                                            {members.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={selectAll}
                                                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                                                >
                                                    {selectedMembers.length === members.length
                                                        ? 'Deselect all'
                                                        : 'Select all'}
                                                </button>
                                            )}
                                        </div>

                                        {isLoadingMembers ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                            </div>
                                        ) : members.length === 0 ? (
                                            <div className="text-center py-4">
                                                <UserGroupIcon className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                                                <p className="text-xs text-gray-500">
                                                    No team members found
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                                                {members.map((member) => (
                                                    <label
                                                        key={member.id}
                                                        className={clsx(
                                                            'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors',
                                                            selectedMembers.includes(member.id) &&
                                                                'bg-primary-50/50'
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMembers.includes(member.id)}
                                                            onChange={() => toggleMember(member.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-medium text-primary-700">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                        {selectedMembers.includes(member.id) && (
                                                            <CheckIcon className="h-4 w-4 text-primary-600 flex-shrink-0" />
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {errors.recipients && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.recipients}
                                            </p>
                                        )}
                                        {selectedMembers.length > 0 && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSending}
                                            className={clsx(
                                                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                                                isSending
                                                    ? 'bg-primary-400 cursor-not-allowed'
                                                    : 'bg-primary-600 hover:bg-primary-700'
                                            )}
                                        >
                                            {isSending ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <PaperAirplaneIcon className="h-4 w-4" />
                                                    Send Notification
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
