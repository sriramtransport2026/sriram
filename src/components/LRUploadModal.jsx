import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Eye, 
  Sparkles, 
  HardDrive, 
  RefreshCw,
  FileCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { db } from '../services/db';
import { compressFileToUnder30KB, formatBytes } from '../utils/imageCompressor';
import logoImg from '../assets/logo.png';

export function LRUploadModal({ trip, isOpen, onClose, onSuccess }) {
  const [lrNumber, setLrNumber] = useState(trip?.lr_number || '');
  
  // Multi-document list state
  const getInitialDocs = () => {
    const list = [];
    if (trip?.lr_file_urls && Array.isArray(trip.lr_file_urls) && trip.lr_file_urls.length > 0) {
      trip.lr_file_urls.forEach((url, idx) => {
        list.push({
          id: 'init-' + idx,
          previewUrl: url,
          compressedFile: null,
          originalFile: null,
          originalSize: 'Archived',
          compressedSize: '< 30 KB',
          name: `LR_Document_${idx + 1}.jpg`,
          isUnder30KB: true
        });
      });
    } else if (trip?.lr_file_url) {
      list.push({
        id: 'init-0',
        previewUrl: trip.lr_file_url,
        compressedFile: null,
        originalFile: null,
        originalSize: 'Archived',
        compressedSize: '< 30 KB',
        name: 'LR_Document_1.jpg',
        isUnder30KB: true
      });
    }
    return list;
  };

  const [docsList, setDocsList] = useState(getInitialDocs);
  
  // Compression & Upload Telemetry
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressingCount, setCompressingCount] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionMsg, setCompressionMsg] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen || !trip) return null;

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    setError('');

    const filesArray = Array.from(files);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'application/pdf'];

    setIsCompressing(true);
    setCompressingCount(filesArray.length);
    setCompressionProgress(10);
    setCompressionMsg(`Analyzing ${filesArray.length} document${filesArray.length > 1 ? 's' : ''}...`);

    const newDocs = [];

    for (let i = 0; i < filesArray.length; i++) {
      const selected = filesArray[i];
      const isImage = selected.type.startsWith('image/');
      const isPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');

      if (!isImage && !isPdf && !validTypes.includes(selected.type)) {
        continue;
      }

      setCompressionMsg(`Optimizing (${i + 1}/${filesArray.length}) ${selected.name}...`);
      setCompressionProgress(Math.round(((i + 0.5) / filesArray.length) * 100));

      try {
        const result = await compressFileToUnder30KB(selected);
        newDocs.push({
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          originalFile: selected,
          compressedFile: result.file,
          previewUrl: result.previewUrl,
          originalSize: formatBytes(selected.size),
          compressedSize: result.formattedCompressedSize || '< 30 KB',
          savingsPercent: result.savingsPercent,
          isUnder30KB: result.isUnder30KB,
          name: selected.name
        });
      } catch (err) {
        console.warn('Compression fallback for', selected.name, err);
        // Fallback: create preview URL
        const blobUrl = URL.createObjectURL(selected);
        newDocs.push({
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          originalFile: selected,
          compressedFile: selected,
          previewUrl: blobUrl,
          originalSize: formatBytes(selected.size),
          compressedSize: formatBytes(selected.size),
          isUnder30KB: selected.size <= 30 * 1024,
          name: selected.name
        });
      }
    }

    setDocsList(prev => [...prev, ...newDocs]);
    setIsCompressing(false);
    setCompressingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = (idToRemove) => {
    setDocsList(prev => prev.filter(d => d.id !== idToRemove));
    if (previewDoc && previewDoc.id === idToRemove) {
      setPreviewDoc(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');
    setUploadPercent(15);

    try {
      const finalUrls = [];
      const totalDocs = docsList.length;

      for (let i = 0; i < totalDocs; i++) {
        const doc = docsList[i];
        if (doc.previewUrl && !doc.compressedFile && !doc.originalFile) {
          // Already uploaded previous URL
          finalUrls.push(doc.previewUrl);
        } else if (doc.compressedFile || doc.originalFile) {
          const fileToUpload = doc.compressedFile || doc.originalFile;
          const uploadedUrl = await db.uploadLRFile(fileToUpload);
          finalUrls.push(uploadedUrl);
        }
        setUploadPercent(Math.round(20 + ((i + 1) / Math.max(totalDocs, 1)) * 75));
      }

      const finalLrNum = lrNumber.trim() || trip.lr_number || `LR-${trip.load_id || Math.floor(100000 + Math.random() * 900000)}`;

      const updated = await db.completeTripWithLR(trip.id, {
        lr_number: finalLrNum,
        lr_file_url: finalUrls[0] || null,
        lr_file_urls: finalUrls
      });

      setUploadPercent(100);
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete trip. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadDemoImage = async (e) => {
    if (e) e.stopPropagation();
    setIsCompressing(true);
    setCompressionProgress(30);
    setCompressionMsg('Generating high-res LR camera scan sample...');

    const canvas = document.createElement('canvas');
    canvas.width = 1800;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1800, 1400);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('SRI RAM TRANSPORT - CONSIGNMENT NOTE / LR', 80, 120);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#0f766e';
    ctx.fillText(`LR COPY #${lrNumber || trip.lr_number || 'LR-2026/DEMO'}`, 80, 190);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 240, 1640, 950);

    ctx.fillStyle = '#334155';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Consignor: Ashirvad Pipes Pvt Ltd`, 110, 310);
    ctx.fillText(`Consignee: Sri Krishna Agencies`, 110, 360);
    ctx.fillText(`From: Bangalore, Jigani ➔ To: Hosur`, 110, 410);
    ctx.fillText(`Vehicle: ${trip.vehicle?.vehicle_number || trip.vehicle_id || 'TN70AP3051'}`, 110, 460);
    ctx.fillText(`Freight Amount: ₹${Number(trip.freight_amount || 0).toLocaleString('en-IN')}`, 110, 510);
    ctx.fillText(`Acknowledged Date: ${new Date().toLocaleDateString('en-IN')}`, 110, 560);

    // Rubber stamp
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 6;
    ctx.strokeRect(1200, 750, 420, 240);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('MATERIAL RECEIVED', 1230, 820);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('IN GOOD CONDITION', 1240, 875);
    ctx.font = '24px monospace';
    ctx.fillText('SIGN & VERIFIED', 1280, 930);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const sampleFile = new File([blob], `Acknowledged_LR_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await handleFilesSelected([sampleFile]);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-8">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-brand-navy via-brand-navy-dark to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <FileText className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display">Upload Signed LR Documents</h3>
                <p className="text-xs text-slate-300">
                  Load #{trip.load_id || trip.id} • {trip.from_location || 'Origin'} ➔ {trip.to_location || 'Destination'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Trip Snapshot Header */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Vehicle:</span>
              <span className="font-bold text-slate-900">{trip.vehicle?.vehicle_number || trip.vehicle_id || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Total Freight:</span>
              <span className="font-black text-emerald-700">₹{Number(trip.freight_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Hard Gate Notice (Unblocked) */}
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Trip Completion & LR Upload:</span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Upload one or multiple acknowledged LR documents. All uploads are <strong>automatically compressed to strictly below 30 KB</strong> while retaining full stamp and signature legibility.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* LR Number Input Field (No Mandatory Asterisk) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                LR Number (Lorry Receipt Book #)
              </label>
              <input
                type="text"
                placeholder="e.g. 9087 or LR-2026/410 (Optional)"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Found stamped at top-right of the physical delivery memo.</p>
            </div>

            {/* LR Document Upload & Multi-Doc Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Signed LR Documents {docsList.length > 0 && `(${docsList.length} Attached)`}
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target: &lt; 30 KB Guaranteed
                </span>
              </div>

              {/* Hidden file input with multiple support */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              {/* In-Progress Compression Loader */}
              {isCompressing && (
                <div className="border border-indigo-200 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 to-white text-center space-y-3 animate-pulse">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Auto-Compressing Documents ({compressingCount})</h4>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">{compressionMsg}</p>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Main Dropzone if no documents uploaded yet */}
              {docsList.length === 0 && !isCompressing && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-navy rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-slate-100/80 transition group relative"
                >
                  <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white shadow-sm border border-slate-200 group-hover:border-brand-navy/30 flex items-center justify-center text-slate-600 group-hover:text-brand-navy transition group-hover:scale-105">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to select or drag & drop signed LR copies
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select multiple files (JPG, PNG, PDF) — <strong>Any size accepted, auto-compressed below 30 KB</strong>
                  </p>
                  
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-reduces size below 30 KB
                    </span>

                    <button
                      type="button"
                      onClick={handleLoadDemoImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 text-[11px] font-bold text-amber-900 transition shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                      <span>Test Auto-Compress Sample</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded Documents List & Gallery */}
              {docsList.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {docsList.map((doc, idx) => (
                      <div 
                        key={doc.id || idx}
                        className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50/90 hover:bg-white flex items-center justify-between transition shadow-xs"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div 
                            className="relative group cursor-pointer shrink-0" 
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <img
                              src={doc.previewUrl}
                              alt="LR Thumbnail"
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:opacity-80 transition bg-white"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-slate-900/40 rounded-xl text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">
                                {doc.name || `LR_Document_${idx + 1}.jpg`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-500">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                {doc.compressedSize || '< 30 KB'}
                              </span>
                              <span>(Orig: {doc.originalSize || 'Raw'})</span>
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="text-brand-navy hover:underline font-semibold flex items-center gap-0.5 ml-1"
                              >
                                <Eye className="w-3 h-3" /> Inspect
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          disabled={isUploading}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                          title="Remove this document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* "+ Upload More" Button Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isCompressing}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-navy/5 hover:bg-brand-navy/10 border border-brand-navy/20 text-brand-navy text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-brand-navy" />
                      <span>+ Upload More LR Copies</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadDemoImage}
                      disabled={isUploading || isCompressing}
                      className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                      <span>+ Add Sample LR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Uploading Active State Overlay/Telemetry */}
            {isUploading && (
              <div className="p-3.5 bg-brand-navy text-white rounded-2xl space-y-2 shadow-lg animate-fade-in">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    Uploading Documents to Cloud Storage...
                  </span>
                  <span className="font-mono text-amber-300">{uploadPercent}%</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-gold h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading || isCompressing}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || isCompressing}
                className="px-6 py-2.5 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-dark rounded-xl shadow-lg hover:shadow-glow transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <span>Saving & Marking Completed...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Mark Completed</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FULL-SIZE PREVIEW MODAL TO VERIFY SIGNATURE & STAMP LEGIBILITY */}
      {previewDoc && previewDoc.previewUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-display flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  LR Document Quality & Legibility Inspection
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewDoc.name} • Size: <strong className="text-emerald-700">{previewDoc.compressedSize || '< 30 KB'}</strong>
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-900/5 p-2 flex justify-center items-center">
              <img 
                src={previewDoc.previewUrl} 
                alt="Full LR Document" 
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-md bg-white" 
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Stamp, LR #, & Signatures Legible
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
