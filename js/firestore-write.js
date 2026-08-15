async function handleDeletePost(postId, event) {
    if (event) event.stopPropagation();
    if (!window.fb) return;
    if (!confirm('確定要刪除這篇貼文嗎？刪除後無法復原。')) return;

    try {
        const { db, doc, deleteDoc } = window.fb;
        await deleteDoc(doc(db, 'posts', postId));
        showToast('🗑️ 貼文已刪除');
    } catch (err) {
        console.error('刪除貼文失敗：', err);
        showToast('❌ 刪除失敗，請確認網路連線或安全規則');
    }
}

async function handleSaveCustomPost(e) {
    e.preventDefault();

    if (!window.fb) {
        showToast('⚠️ 尚未連上資料庫，請稍後再試一次');
        return;
    }

    const title = document.getElementById('newTitle').value.trim();
    const category = document.getElementById('newCategory').value;
    const readTime = document.getElementById('newReadTime').value.trim() || '3 分鐘';
    const rawImages = document.getElementById('newImages').value.trim();
    const igUrl = document.getElementById('newIgUrl').value.trim();
    const rawTags = document.getElementById('newTags').value.trim();
    const summary = document.getElementById('newSummary').value.trim();

    let imagesArr = rawImages ? rawImages.split(',').map(s => s.trim()) : [];
    if (imagesArr.length === 0) {
        imagesArr = [DEFAULT_FALLBACK_IMAGES[category]];
    }
    imagesArr = imagesArr.map(addWatermark);

    let tagsArr = rawTags ? rawTags.split(',').map(s => s.trim().startsWith('#') ? s.trim() : '#' + s.trim()) : ['#新圖文'];

    const newPost = {
        title: title,
        category: category,
        tags: tagsArr,
        date: editingPostId ? (customPosts.find(p => p.id === editingPostId)?.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        readTime: readTime,
        likes: editingPostId ? (customPosts.find(p => p.id === editingPostId)?.likes || 0) : 0,
        featured: false,
        image: imagesArr[0],
        images: imagesArr,
        summary: summary,
        igUrl: sanitizeUrl(igUrl),
        content: `<p class="whitespace-pre-line">${escapeHtml(summary)}</p>`
    };

    try {
        const { db, collection, addDoc, doc, updateDoc, serverTimestamp } = window.fb;
        if (editingPostId) {
            await updateDoc(doc(db, 'posts', editingPostId), newPost);
            closeAddPostModal();
            e.target.reset();
            showToast('✅ 貼文已更新');
        } else {
            newPost.createdAt = serverTimestamp();
            await addDoc(collection(db, 'posts'), newPost);
            closeAddPostModal();
            e.target.reset();
            showToast('✨ 成功新增並發布新圖文貼文！所有訪客都看得到囉');
        }
    } catch (err) {
        console.error('儲存貼文失敗：', err);
        showToast('❌ 儲存失敗，請確認網路連線或 Firestore 安全規則');
    }
}
