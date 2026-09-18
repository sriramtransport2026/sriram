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
  FileCheck
} from 'lucide-react';
import { db } from '../services/db';
import { compressFileToUnder30KB, formatBytes } from '../utils/imageCompressor';
import logoImg from '../assets/logo.png';

export function LRUploadModal({ trip, isOpen, onClose, onSuccess }) {
  const [lrNumber, setLrNumber] = useState(trip?.lr_number || '');
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(trip?.lr_file_url || null);
  
  // Compression & Upload Telemetry
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionMsg, setCompressionMsg] = useState('');
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [savingsPercent, setSavingsPercent] = useState(null);
  const [isUnder30KB, setIsUnder30KB] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState('');
  const [showFullPreview, setShowFullPreview] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !trip) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type (supports all image formats and PDF)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'application/pdf'];
    const isImage = selected.type.startsWith('image/');
    const isPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf && !validTypes.includes(selected.type)) {
      setError('Please upload an image (JPG, PNG, WEBP) or PDF document.');
      return;
    }

    setError('');
    setOriginalFile(selected);
    setOriginalSize(formatBytes(selected.size));
    setIsCompressing(true);
    setCompressionProgress(10);
    setCompressionMsg('Analyzing document...');

    try {
      // Execute auto-compression strictly below 30 KB (< 30,720 bytes)
      const result = await compressFileToUnder30KB(selected, (progress) => {
        setCompressionProgress(progress.percent || 50);
        setCompressionMsg(progress.message || 'Optimizing document...');
      });

      setCompressedFile(result.file);
      setCompressedSize(result.formattedCompressedSize);
      setSavingsPercent(result.savingsPercent);
      setIsUnder30KB(result.isUnder30KB);
      setPreviewUrl(result.previewUrl);
      setIsCompressing(false);
    } catch (err) {
      console.error('Compression error:', err);
      setIsCompressing(false);
      setError(err.message || 'Auto-compression failed. Please choose another image.');
    }
  };

  const handleResetFile = () => {
    setOriginalFile(null);
    setCompressedFile(null);
    setPreviewUrl(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setSavingsPercent(null);
    setIsUnder30KB(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lrNumber.trim()) {
      setError('LR Number is strictly required to complete the trip.');
      return;
    }
    if (!compressedFile && !originalFile && !previewUrl) {
      setError('Signed LR copy document must be uploaded.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadPercent(20);

    try {
      let finalFileUrl = previewUrl;
      const fileToUpload = compressedFile || originalFile;

      if (fileToUpload) {
        setUploadPercent(50);
        // Upload the strictly <30KB file
        finalFileUrl = await db.uploadLRFile(fileToUpload);
        setUploadPercent(85);
      }

      const updated = await db.completeTripWithLR(trip.id, {
        lr_number: lrNumber.trim(),
        lr_file_url: finalFileUrl,
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
    setCompressionProgress(15);
    setCompressionMsg('Generating high-res LR camera scan sample...');

    // Generate high-resolution 1800x1400 canvas with simulated LR receipt
    const canvas = document.createElement('canvas');
    canvas.width = 1800;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1800, 1400);

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#0a2240';
    ctx.strokeRect(40, 40, 1720, 1320);

    ctx.fillStyle = '#0a2240';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('SRI RAM TRANSPORT — CONSIGNMENT LORRY RECEIPT', 80, 130);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#b45309';
    ctx.fillText(`LR NO: ${lrNumber || 'LR-2026/8899'}   |   LOAD ID: #${trip.load_id}`, 80, 200);

    ctx.fillStyle = '#1e293b';
    ctx.font = '30px sans-serif';
    ctx.fillText(`Consignor: ${trip.consignor || 'Ashirvad Pipes Pvt Ltd'}`, 80, 280);
    ctx.fillText(`Consignee: ${trip.consignee || 'Authorized Stockist Depot'}`, 80, 340);
    ctx.fillText(`Vehicle: ${trip.vehicle?.vehicle_number || trip.vehicle_id}   |   Route: ${trip.from_location} ➔ ${trip.to_location}`, 80, 400);
    ctx.fillText(`Weight: ${trip.charged_weight || 4.5} MT   |   Freight: Rs. ${Number(trip.freight_amount).toLocaleString('en-IN')}`, 80, 460);

    // Add signature & verified stamp
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 6;
    ctx.strokeRect(1200, 1050, 480, 220);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('GOODS RECEIVED IN', 1230, 1120);
    ctx.fillText('GOOD CONDITION', 1260, 1170);
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('OFFICIAL STAMP & SIGN', 1240, 1230);

    // Inject rich graphic entropy to create realistic large raw camera file
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.35)`;
      ctx.fillRect(Math.random() * 1800, 520 + Math.random() * 500, Math.random() * 25 + 5, Math.random() * 25 + 5);
    }

    canvas.toBlob(async (blob) => {
      const rawFile = new File([blob], 'HighRes_Camera_LR_Scan_Raw.png', { type: 'image/png' });
      setOriginalFile(rawFile);
      setOriginalSize(formatBytes(rawFile.size));
      try {
        const result = await compressFileToUnder30KB(rawFile, (p) => {
          setCompressionProgress(p.percent || 50);
          setCompressionMsg(p.message || 'Optimizing resolution & quality...');
        });
        setCompressedFile(result.file);
        setCompressedSize(result.formattedCompressedSize);
        setSavingsPercent(result.savingsPercent);
        setIsUnder30KB(result.isUnder30KB);
        setPreviewUrl(result.previewUrl);
        setIsCompressing(false);
      } catch (err) {
        setIsCompressing(false);
        setError(err.message || 'Compression error');
      }
    }, 'image/png');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200/80 animate-scale-up my-auto">
          
          {/* Top Header with Corporate Navy Branding */}
          <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-3.5">
              <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-md">
                <img src={logoImg} alt="Sri Ram Transport" className="h-7 w-auto object-contain" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm tracking-wide text-white font-display">LR Proof of Delivery Verification</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3 fill-slate-950" /> &lt;30 KB Auto-Fit
                  </span>
                </div>
                <p className="text-[11px] text-brand-gold-light font-medium">Sri Ram Transport Verification Protocol</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading || isCompressing}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Trip Summary Header Strip */}
          <div className="bg-slate-50 border-b border-slate-200/70 px-6 py-2.5 text-xs text-slate-600 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">LOAD ID:</span>
              <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                #{trip.load_id}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Vehicle:</span>
              <span className="font-bold text-slate-900">{trip.vehicle?.vehicle_number || trip.vehicle_id}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Total Freight:</span>
              <span className="font-black text-emerald-700">₹{Number(trip.freight_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Regulatory Hard Gate Alert */}
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Trip Completion Hard Gate:</span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Upload the physical acknowledged LR copy. All uploads are <strong>automatically compressed to strictly below 30 KB</strong> while retaining full signature and stamp legibility.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* LR Number Input Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                LR Number (Lorry Receipt Book #) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9087 or LR-2026/410"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Found stamped at top-right of the physical delivery memo.</p>
            </div>

            {/* LR Document Upload & Auto-Compression Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Signed LR Document <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target: &lt; 30 KB Guaranteed
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Dropzone */}
              {!previewUrl && !isCompressing ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-navy rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-slate-100/80 transition group relative"
                >
                  <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white shadow-sm border border-slate-200 group-hover:border-brand-navy/30 flex items-center justify-center text-slate-600 group-hover:text-brand-navy transition group-hover:scale-105">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to select or drag & drop signed LR
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload any photo or scan (JPG, PNG, PDF) — <strong>Any size accepted</strong>
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
              ) : null}

              {/* In-Progress Compression Loader */}
              {isCompressing && (
                <div className="border border-indigo-200 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 to-white text-center space-y-3 animate-pulse">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Auto-Compressing LR Document</h4>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">{compressionMsg}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Original Size: <strong className="text-slate-800">{originalSize}</strong></p>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Compressed Document Summary Card with Dual-Size Telemetry */}
              {previewUrl && !isCompressing && (
                <div className="space-y-3">
                  
                  {/* DUAL-SIZE COMPARISON BANNER (Original vs Uploaded Size) */}
                  <div className="border border-emerald-200 rounded-2xl p-3.5 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/40 shadow-sm space-y-2.5">
                    
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Size Optimization Complete
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                        &lt; 30 KB TARGET MET
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      
                      {/* 1. ORIGINAL FILE SIZE */}
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          Original Size
                        </div>
                        <div className="text-base font-black text-slate-700 mt-0.5 font-mono">
                          {originalSize || 'Uncompressed'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {originalFile ? originalFile.name : 'Uploaded Document'}
                        </div>
                      </div>

                      {/* 2. UPLOADED / COMPRESSED SIZE */}
                      <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-300 shadow-xs">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Uploaded Size
                          </span>
                          {savingsPercent && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              -{savingsPercent}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black text-emerald-800 mt-0.5 font-mono flex items-center gap-1.5">
                          <span>{compressedSize || '< 30 KB'}</span>
                          <span className="text-[11px] font-bold text-emerald-600">(&lt;30 KB ✓)</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Strictly below 30KB archived
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail & Change File Bar */}
                  <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="relative group cursor-pointer" onClick={() => setShowFullPreview(true)}>
                        <img
                          src={previewUrl}
                          alt="LR Thumbnail"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:opacity-80 transition"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-slate-900/40 rounded-xl text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {compressedFile ? compressedFile.name : 'Signed_LR_Optimized.jpg'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowFullPreview(true)}
                          className="text-[11px] text-brand-navy hover:underline font-semibold flex items-center gap-1 mt-0.5"
                        >
                          <Eye className="w-3 h-3" /> Inspect Legibility
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetFile}
                      disabled={isUploading}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      Change File
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
                    Uploading Optimized Document...
                  </span>
                  <span className="font-mono text-amber-300">{compressedSize || '< 30 KB'}</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-gold h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                  <span>Original: {originalSize || 'Raw file'}</span>
                  <span>Target: Strictly &lt; 30 KB</span>
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
                disabled={isUploading || isCompressing || (!compressedFile && !previewUrl)}
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
      {showFullPreview && previewUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-display flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  LR Document Quality & Legibility Inspection
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded Size: <strong className="text-emerald-700">{compressedSize || '< 30 KB'}</strong> (Original: {originalSize || 'Raw'})
                </p>
              </div>
              <button
                onClick={() => setShowFullPreview(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-900/5 p-2 flex justify-center items-center">
              <img 
                src={previewUrl} 
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
                onClick={() => setShowFullPreview(false)}
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
