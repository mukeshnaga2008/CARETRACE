'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  PhoneCall, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Phone, 
  Mail, 
  Info,
  Lock 
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { INITIAL_EMERGENCY_CONTACTS } from '@/lib/data/patient-profile-data';
import { EmergencyContact } from '@/types/caretrace';
import { AppRole } from '@/lib/constants';

export default function EmergencyContactsPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [contacts, setContacts] = React.useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<EmergencyContact | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Form State
  const [contactName, setContactName] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [priorityOrder, setPriorityOrder] = React.useState(1);
  const [isAuthorizedCaregiver, setIsAuthorizedCaregiver] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isCaregiver = activeRole === 'caregiver';

  const openAddModal = () => {
    setEditingContact(null);
    setContactName('');
    setRelationship('');
    setPhoneNumber('');
    setEmail('');
    setPriorityOrder(contacts.length + 1);
    setIsAuthorizedCaregiver(false);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactName(c.contactName);
    setRelationship(c.relationship);
    setPhoneNumber(c.phoneNumber);
    setEmail(c.email || '');
    setPriorityOrder(c.priorityOrder);
    setIsAuthorizedCaregiver(c.isAuthorizedCaregiver);
    setNotes(c.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isCaregiver) {
      setFormError('Caregiver accounts have read-only access to emergency contacts.');
      return;
    }

    if (!contactName || !relationship || !phoneNumber) {
      setFormError('Please fill in Contact Name, Relationship, and Phone Number.');
      return;
    }

    try {
      if (editingContact) {
        // Edit mode
        const res = await fetch(`/api/patient/emergency-contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactName,
            relationship,
            phoneNumber,
            email: email || undefined,
            priorityOrder,
            isAuthorizedCaregiver,
            notes: notes || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Failed to update contact.');
          return;
        }

        setContacts(data.contacts);
        setFeedback({ type: 'success', text: `Emergency contact ${contactName} updated.` });
      } else {
        // Add mode
        const res = await fetch('/api/patient/emergency-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactName,
            relationship,
            phoneNumber,
            email: email || undefined,
            priorityOrder,
            isAuthorizedCaregiver,
            notes: notes || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Failed to add contact.');
          return;
        }

        setContacts(data.contacts);
        setFeedback({ type: 'success', text: `Emergency contact ${contactName} added at priority #${priorityOrder}.` });
      }

      setIsModalOpen(false);
    } catch {
      setFormError('Network error while saving emergency contact.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patient/emergency-contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to remove contact.' });
        return;
      }
      setContacts(data.contacts);
      setDeleteConfirmId(null);
      setFeedback({ type: 'success', text: data.message });
    } catch {
      setFeedback({ type: 'error', text: 'Error connecting to delete endpoint.' });
    }
  };

  const handleMovePriority = async (id: string, direction: 'up' | 'down') => {
    if (isCaregiver) return;

    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contacts.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newContacts = [...contacts];
    
    // Swap items
    const temp = newContacts[index];
    newContacts[index] = newContacts[swapIndex];
    newContacts[swapIndex] = temp;

    // Assign sequential priorities
    const updates = newContacts.map((c, idx) => ({
      id: c.id,
      priorityOrder: idx + 1,
    }));

    try {
      const res = await fetch('/api/patient/emergency-contacts/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts);
        setFeedback({ type: 'success', text: 'Priority order updated successfully.' });
      }
    } catch {
      // Revert if failed
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Emergency Escalation Tree"
        description="Priority-ordered contacts for urgent alerts, hospital escorts, and caregiver coordination."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile', href: '/profile' },
          { label: 'Emergency Contacts' },
        ]}
        actions={
          <button
            type="button"
            disabled={isCaregiver}
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 touch-target-min"
          >
            <Plus className="h-4 w-4" />
            <span>Add Emergency Contact</span>
          </button>
        }
      >
        <ProfileNavTabs />

        {/* Clinical & Privacy Regulatory Notice */}
        <div className="mb-6 p-4 rounded-xl bg-canvas-background border border-subtleBorder flex items-start gap-3 text-xs text-secondaryText">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-main block">Emergency Escalation Notice:</span>
            <p>
              1. <strong>Not a 911 Dispatch Service:</strong> This escalation tree specifies who our care coordination engine alerts when Margaret requires assistance. Always call 911 directly for acute life-threatening situations.
            </p>
            <p>
              2. <strong>Non-Caregiver Assumption:</strong> Designating a person as an emergency contact does NOT automatically grant them permission to view private medical or medication records. Access requires explicit clinical consent.
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-[#EAF4EE] border border-clinical-successBorder text-[#1B6346]'
              : 'bg-clinical-dangerBg border border-clinical-dangerBorder text-[#852D2D]'
          }`} role="status">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{feedback.type === 'success' ? 'Updated' : 'Notice'}</p>
              <p className="text-xs mt-0.5">{feedback.text}</p>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts.map((contact, idx) => (
            <div 
              key={contact.id}
              className="p-5 rounded-2xl border border-subtleBorder bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-mint-border"
            >
              <div className="flex items-start gap-4">
                {/* Priority Badge */}
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  #{contact.priorityOrder}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-main">{contact.contactName}</h3>
                    <span className="text-xs text-secondaryText font-medium">({contact.relationship})</span>
                    {contact.isAuthorizedCaregiver ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-mint text-primary text-[10px] font-bold border border-mint-border">
                        Authorized Caregiver
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-canvas-subtle text-mutedText text-[10px] font-medium border border-subtleBorder">
                        Emergency Only (No Medical Access)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondaryText">
                    <span className="flex items-center gap-1.5 font-semibold text-main">
                      <Phone className="h-3.5 w-3.5 text-secondary" />
                      {contact.phoneNumber}
                    </span>
                    {contact.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-secondaryText" />
                        {contact.email}
                      </span>
                    )}
                  </div>

                  {contact.notes && (
                    <p className="text-xs text-mutedText italic pt-1 max-w-2xl">
                      &ldquo;{contact.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Actions & Priority Reordering */}
              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-subtleBorder">
                {/* Priority Reordering Buttons */}
                <div className="flex items-center border border-subtleBorder rounded-xl overflow-hidden bg-canvas-background">
                  <button
                    type="button"
                    disabled={isCaregiver || idx === 0}
                    onClick={() => handleMovePriority(contact.id, 'up')}
                    aria-label={`Move ${contact.contactName} priority up`}
                    className="p-2 hover:bg-canvas-subtle disabled:opacity-30 text-secondaryText transition-colors touch-target-min"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isCaregiver || idx === contacts.length - 1}
                    onClick={() => handleMovePriority(contact.id, 'down')}
                    aria-label={`Move ${contact.contactName} priority down`}
                    className="p-2 hover:bg-canvas-subtle disabled:opacity-30 text-secondaryText transition-colors touch-target-min border-l border-subtleBorder"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  disabled={isCaregiver}
                  onClick={() => openEditModal(contact)}
                  aria-label={`Edit ${contact.contactName}`}
                  className="p-2.5 rounded-xl border border-subtleBorder hover:bg-canvas-subtle text-secondaryText hover:text-main transition-colors disabled:opacity-40 touch-target-min"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* Delete Button with Confirmation Guard */}
                {deleteConfirmId === contact.id ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => handleDelete(contact.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-clinical-danger text-white text-xs font-bold hover:bg-red-700 transition-colors touch-target-min"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1.5 rounded-lg border border-subtleBorder text-xs text-secondaryText hover:bg-canvas-subtle touch-target-min"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isCaregiver}
                    onClick={() => setDeleteConfirmId(contact.id)}
                    aria-label={`Remove ${contact.contactName}`}
                    className="p-2.5 rounded-xl border border-subtleBorder hover:bg-clinical-dangerBg text-secondaryText hover:text-[#852D2D] transition-colors disabled:opacity-40 touch-target-min"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add / Edit Emergency Contact */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-subtleBorder max-w-lg w-full p-6 shadow-elevated relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-secondaryText hover:text-main p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-main mb-1">
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h2>
              <p className="text-xs text-secondaryText mb-5">
                Ensure phone details are active for immediate contact in medical urgencies.
              </p>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-clinical-dangerBg border border-clinical-dangerBorder text-xs text-[#852D2D]">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveContact} className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-xs font-bold text-main mb-1.5">
                    Contact Name *
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. David Sullivan"
                    className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="relationship" className="block text-xs font-bold text-main mb-1.5">
                      Relationship *
                    </label>
                    <input
                      id="relationship"
                      type="text"
                      required
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="e.g. Son, Neighbor"
                      className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="priorityOrder" className="block text-xs font-bold text-main mb-1.5">
                      Priority Order
                    </label>
                    <input
                      id="priorityOrder"
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={priorityOrder}
                      onChange={(e) => setPriorityOrder(parseInt(e.target.value) || 1)}
                      className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-bold text-main mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-main mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-canvas-background border border-subtleBorder">
                  <div className="flex items-start">
                    <input
                      id="isCaregiver"
                      type="checkbox"
                      checked={isAuthorizedCaregiver}
                      onChange={(e) => setIsAuthorizedCaregiver(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-subtleBorder text-secondary focus:ring-secondary"
                    />
                    <label htmlFor="isCaregiver" className="ml-2.5 block text-xs text-main leading-relaxed">
                      <span className="font-bold">Also Authorized Caregiver</span>
                      <span className="block text-[11px] text-secondaryText">
                        Check only if this person has signed clinical consent to view medications and care tasks. Leave unchecked for pure emergency contacts (e.g. neighbors or superintendents).
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-xs font-bold text-main mb-1.5">
                    Special Coordination Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Holds apartment key. Lives 10 minutes away."
                    className="w-full p-3 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-subtleBorder text-xs font-semibold text-secondaryText hover:bg-canvas-subtle touch-target-min"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm touch-target-min"
                  >
                    {editingContact ? 'Save Contact' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
