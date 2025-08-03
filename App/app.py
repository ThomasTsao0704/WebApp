# app.py
import streamlit as st
import pandas as pd
import plotly.graph_objects as go

# ===== 頁面設定 =====
st.set_page_config(
    page_title="股市儀表板 Demo",
    page_icon="📈",
    layout="wide"
)

# ===== 側邊欄 =====
with st.sidebar:
    st.title("📊 股市儀表板")
    page = st.radio("選擇頁面", ["大盤走勢", "產業分析", "個股查詢", "名詞解釋"])
    st.markdown("---")
    st.info("歡迎體驗可編輯的 Streamlit 前端模板！")

# ===== 樣本數據（可換成你自己的 DataFrame）=====
sample_data = pd.DataFrame({
    "日期": pd.date_range("2024-07-01", periods=10, freq="D"),
    "收盤價": [234, 236, 238, 237, 240, 243, 241, 239, 242, 245],
    "成交量": [12000, 13500, 12500, 13000, 14500, 15000, 14300, 13900, 14700, 15300],
    "股票代碼": ["2330"] * 10,
})

# ===== 分頁切換主體內容 =====
if page == "大盤走勢":
    st.header("📈 大盤走勢")
    st.subheader("收盤價折線圖")
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=sample_data["日期"],
        y=sample_data["收盤價"],
        mode='lines+markers',
        name='收盤價'
    ))
    fig.update_layout(height=350, margin=dict(l=20, r=20, t=30, b=20))
    st.plotly_chart(fig, use_container_width=True)
    
    st.subheader("成交量長條圖")
    st.bar_chart(sample_data.set_index("日期")["成交量"])
    
    st.subheader("數據表")
    st.dataframe(sample_data, use_container_width=True)

elif page == "產業分析":
    st.header("🏭 產業分析")
    # 假資料，實際可自行更換
    industry_df = pd.DataFrame({
        "產業": ["半導體", "金融", "航運", "鋼鐵"],
        "加權指數": [1200, 900, 700, 500],
        "本益比": [25, 15, 13, 10]
    })
    st.dataframe(industry_df, use_container_width=True)
    st.bar_chart(industry_df.set_index("產業")["加權指數"])

elif page == "個股查詢":
    st.header("🔍 個股查詢")
    stock_code = st.text_input("輸入股票代碼", "2330")
    # 這裡可加搜尋/過濾功能
    df = sample_data[sample_data["股票代碼"] == stock_code]
    if df.empty:
        st.warning(f"查無股票代碼：{stock_code}")
    else:
        st.write(f"顯示 {stock_code} 歷史資料：")
        st.dataframe(df, use_container_width=True)
        st.line_chart(df.set_index("日期")["收盤價"])

elif page == "名詞解釋":
    st.header("📚 名詞解釋")
    st.markdown("""
    - **收盤價**：指該日最後一筆成交的價格。
    - **成交量**：當天交易的股數總量。
    - **本益比**：Price/Earnings Ratio，評估股價是否合理的指標。
    - **產業加權指數**：某產業股票加權平均的表現指標。
    """)
    st.info("可自訂 FAQ、說明、行情術語等內容")

# ===== 頁尾 =====
st.caption("本模板由 ChatGPT 生成，歡迎隨意修改運用。")
