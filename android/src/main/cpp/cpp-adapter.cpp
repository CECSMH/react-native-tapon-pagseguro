#include <jni.h>
#include "taponpagseguroOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::taponpagseguro::initialize(vm);
}
