import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { closeModal, Direction, ModalId } from "../../../redux/features/modals.slice";
import { useAppDispatch, useAppSelector } from "../../../utils/hooks";
import LoginNativeWalletCard from "../../Login/LoginNativeWalletCard";
import LoginSuccessCard from "../../Login/LoginSuccessCard";
import ScanningWalletCard from "../../Login/ScanningWalletCard";
import ProjectCard from "../../Project/ProjectCard";
import VoteCard from "../../Vote/VoteCard";
import Modal from "../Modal/Modal";
import { Portal } from "../Portal/Portal";

export interface ModalCard {
    onClose?: () => void;
    direction: number;
    [key: string]: any;
}

export const modalCardVariants = {
    initial: (direction: any) => {
        if (direction === Direction.START) return { opacity: 0, y: 300 };
        else if (direction === Direction.NEXT) return { opacity: 0, x: 300 };
        else if (direction === Direction.PREVIOUS) return { opacity: 0, x: -300 };
        return {}
    },
    animate: {
        x: 0, y: 0, opacity: 1, transition: { type: "spring" }
    },
    exit: (direction: Direction) => {
        const transition = { ease: "easeIn" }
        if (direction === Direction.EXIT) return { transition, opacity: 0, y: 300 };
        else if (direction === Direction.NEXT) return { transition, opacity: 0, x: -300 };
        else if (direction === Direction.PREVIOUS) return { transition, opacity: 0, x: 300 };
        return {}
    },

}



const ModalsMap = (modalId: ModalId) => {
    switch (modalId) {
        case ModalId.Project:
            return ProjectCard;
        case ModalId.LoginScanWallet:
            return ScanningWalletCard;
        case ModalId.LoginNativeWallet:
            return LoginNativeWalletCard;
        case ModalId.LoginSuccess:
            return LoginSuccessCard;
        case ModalId.Vote:
            return VoteCard;
        default:
            return () => <></>
    }

}


export default function ModalsContainer() {

    const { isOpen, openModals, direction } = useAppSelector(state => ({ isOpen: state.modals.isOpen, openModals: state.modals.openModals, direction: state.modals.direction }))

    const dispatch = useAppDispatch();
    const onClose = () => dispatch(closeModal());

    useEffect(() => {
        if (isOpen) document.body.style.overflowY = "hidden";
        else document.body.style.overflowY = "initial";
    }, [isOpen]);


    return (
        <Portal>
            <AnimatePresence exitBeforeEnter>
                {isOpen &&
                    <motion.div
                        className="w-screen h-scree fixed inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{
                            opacity: 0,
                            transition: { ease: "easeInOut" },
                        }}
                    >

                        {openModals.map(modal => {
                            const Child = ModalsMap(modal.modalId);
                            return (
                                <Modal key={modal.modalId} onClose={onClose}>
                                    <Child onClose={onClose} direction={direction} {...modal.propsToPass} />
                                </Modal>)
                        })}
                    </motion.div>}
            </AnimatePresence>
        </Portal>
    )
}
