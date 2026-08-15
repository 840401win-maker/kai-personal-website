function rebuildPostsData() {
    const taggedCustom = customPosts.map(p => ({ ...p, _isCustom: true }));
    postsData = [...taggedCustom, ...staticPostsData];
}

function startFirestoreSync() {
    if (!window.fb) return;
    const { db, collection, onSnapshot, query, orderBy } = window.fb;
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    onSnapshot(postsQuery, (snapshot) => {
        customPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rebuildPostsData();
        renderPosts();
    }, (error) => {
        console.error('Firestore 讀取失敗：', error);
        showToast('⚠️ 貼文資料讀取失敗，請確認 Firestore 安全規則設定');
    });

    firestoreReady = true;
}
