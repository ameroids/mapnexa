
package com.ameroids.software

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebResourceRequest
import android.view.WindowManager
import android.widget.Toast
import android.content.Intent
import android.net.Uri
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val websiteUrl =
        "https://mapnexa.ameroids.in/#/login"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen mode
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        // WebView settings
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        // Handle external links such as Google Maps
        webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {

                val uri = request.url
                val url = uri.toString()
                val scheme = uri.scheme?.lowercase()
                val host = uri.host?.lowercase() ?: ""

                // Detect Google Maps links
                val isGoogleMaps =
                    host == "maps.google.com" ||
                            (
                                    (host == "www.google.com" ||
                                            host == "google.com") &&
                                            (uri.path?.startsWith("/maps") == true)
                                    ) ||
                            host == "maps.app.goo.gl" ||
                            host == "goo.gl"

                // Keep normal website pages inside WebView
                if ((scheme == "https" || scheme == "http")
                    && !isGoogleMaps
                ) {
                    return false
                }

                // Open Google Maps or other external Android apps
                try {

                    val intent = if (scheme == "intent") {
                        Intent.parseUri(
                            url,
                            Intent.URI_INTENT_SCHEME
                        )
                    } else {
                        Intent(Intent.ACTION_VIEW, uri)
                    }

                    startActivity(intent)

                } catch (e: Exception) {

                    // Handle browser fallback
                    try {

                        if (scheme == "intent") {

                            val fallbackIntent = Intent.parseUri(
                                url,
                                Intent.URI_INTENT_SCHEME
                            )

                            val fallbackUrl =
                                fallbackIntent.getStringExtra(
                                    "browser_fallback_url"
                                )

                            if (!fallbackUrl.isNullOrEmpty() &&
                                fallbackUrl.startsWith("https://")
                            ) {
                                view.loadUrl(fallbackUrl)
                            } else {
                                Toast.makeText(
                                    this@MainActivity,
                                    "Google Maps is not available",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }

                        } else {

                            Toast.makeText(
                                this@MainActivity,
                                "Unable to open external link",
                                Toast.LENGTH_SHORT
                            ).show()
                        }

                    } catch (ex: Exception) {

                        Toast.makeText(
                            this@MainActivity,
                            "Unable to open link",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                return true
            }
        }

        // WebChromeClient
        webView.webChromeClient = WebChromeClient()

        // Load Mapnexa website
        webView.loadUrl(websiteUrl)

        // Back navigation
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {

                override fun handleOnBackPressed() {

                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        finish()
                    }
                }
            }
        )
    }
}
