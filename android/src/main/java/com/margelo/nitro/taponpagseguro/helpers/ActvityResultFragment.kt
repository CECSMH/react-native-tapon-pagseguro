package com.margelo.nitro.taponpagseguro.helpers

import android.content.Intent
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts

class ActivityResultFragment : Fragment() {
    companion object {
        private const val FRAGMENT_TAG = "ActivityResultFragment_TapOnPagSeguro"

        @JvmStatic
        fun get_fragment(activity: FragmentActivity): ActivityResultFragment {
            val fragmentManager = activity.supportFragmentManager
            var fragment = fragmentManager.findFragmentByTag(FRAGMENT_TAG) as? ActivityResultFragment
            
            if (fragment == null || fragment.isDetached || !fragment.isAdded) {
                fragment = ActivityResultFragment()
                fragmentManager.beginTransaction().add(fragment, FRAGMENT_TAG).commitNow() 
            }
            if (!fragment.lifecycle.currentState.isAtLeast(androidx.lifecycle.Lifecycle.State.CREATED)) {
                throw IllegalStateException("Fragment added but not yet in CREATED state")
            }
            return fragment
        }
    }

    private var current_callback: ((ActivityResult) -> Unit)? = null

    private val launcher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        current_callback?.invoke(result)
        current_callback = null 
    }

    fun launchForResult(intent: Intent, callback: (ActivityResult) -> Unit) {
        current_callback = callback
        launcher.launch(intent)
    }
}